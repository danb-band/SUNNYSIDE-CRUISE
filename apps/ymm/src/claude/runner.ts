import { Message } from 'discord.js'
import { spawn } from 'child_process'
import readline from 'node:readline'
import { c, ts, stripAnsi, truncate } from '../utils/ansi.js'
import { formatToolInput, summarizeToolResult } from './formatter.js'
import { createDiscordLogger } from '../discord/discordLogger.js'
import { cleanup } from '../discord/attachments.js'
import { PROJECT_ROOT } from '../config.js'
import { buildSharedAgentContextPrompt } from '../sharedAgentContext.js'

const WORKFLOW_RULES = `[WORKFLOW RULES]

작업을 시작하기 전에 반드시 다음 절차를 수행해야 한다.

1. dev 브랜치를 checkout 하고 최신 상태로 pull 한다.
2. claude.md 파일을 읽는다.
3. claude.md에 정의된 작업 규칙을 요약한다.
4. 작업 계획을 먼저 작성하고 요약해서 출력한다.
5. 계획이 완료되기 전에는 코드를 수정하지 않는다.

작업을 완료한 후에는 반드시 다음 절차를 수행해야 한다.

- 테스트 실행
- 빌드 확인
- 테스트와 빌드가 모두 성공한 경우에만 PR 생성

이 규칙은 항상 준수해야 한다.
규칙을 따르지 못하는 경우 작업을 중단하고 이유를 설명해야 한다.

---

`

const COMMIT_INSTRUCTIONS = `

---
[커밋 규칙]
- 작업이 끝나면 반드시 git commit을 생성하세요.
- 작업이 여러 기능을 포함한다면 기능 단위로 나눠서 각각 커밋하세요.
- 커밋 메시지는 "feat: ...", "fix: ...", "refactor: ..." 등 conventional commit 형식으로 한국어로 작성하세요.
- 커밋 전 git status로 변경 파일을 확인하고, 관련 파일만 stage하세요.
`

type SendFn = (content: string) => Promise<unknown>

type RunOptions = {
  sessionId?: string                   // 이어갈 세션 ID (없으면 새 세션)
  onSessionId?: (id: string) => void   // 세션 ID 획득 시 콜백
  onDone?: () => void                  // 프로세스 종료 시 콜백
  onSuccess?: () => Promise<void>      // 작업 성공 시 콜백
  logChannel?: { send: SendFn }        // 로그 전용 채널 (DISCORD_LOG_ID)
  resultChannel?: { send: SendFn }     // 결과 전용 채널 (DISCORD_RESULT_ID)
  commandChannel?: { send: SendFn }    // 명령/질의응답 채널 — 유저 확인/의사결정 필요 시 사용
}

export function runClaudeCode(
  prompt: string,
  message: Message,
  processingMsg: Message,
  tempFiles: string[],
  { sessionId, onSessionId, onDone, onSuccess, logChannel, resultChannel, commandChannel }: RunOptions = {}
) {
  const start = Date.now()
  // 로그는 logChannel 우선, 없으면 command 채널로 fallback
  const discordLogger = createDiscordLogger(
    logChannel ?? (message.channel as { send: (content: string) => Promise<unknown> })
  )

  const promptPreview = prompt.slice(0, 100) + (prompt.length > 100 ? '...' : '')
  const sessionLabel = sessionId ? ` (세션 재개: ${sessionId.slice(0, 8)}...)` : ' (새 세션)'
  console.log(`\n${ts()} ${c.bold}${c.cyan}══ 작업 시작${sessionLabel} ══${c.reset}`)
  console.log(`${ts()} ${c.cyan}프롬프트:${c.reset} "${promptPreview}"`)
  discordLogger.log(`\n══ 작업 시작${sessionLabel} ══\n프롬프트: "${promptPreview}"`)

  const fullPrompt =
    WORKFLOW_RULES +
    buildSharedAgentContextPrompt({ projectRoot: PROJECT_ROOT }) +
    prompt +
    COMMIT_INSTRUCTIONS

  const args = sessionId
    ? ['--resume', sessionId, '-p', fullPrompt]
    : ['-p', fullPrompt]
  args.push('--allowedTools', 'Read,Write,Edit,Bash,Glob,Grep', '--output-format', 'stream-json', '--verbose')

  const child = spawn('claude', args, {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let decisionCount = 0
  const toolIdToNum = new Map<string, number>()
  const toolIdToName = new Map<string, string>()
  const toolStats = new Map<string, number>()

  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  rl.on('line', (line) =>
    handleStreamLine(line, {
      discordLogger,
      processingMsg,
      resultChannel,
      commandChannel,
      start,
      decisionCount,
      toolIdToNum,
      toolIdToName,
      toolStats,
      onDecisionCount: (n) => { decisionCount = n },
      onSessionId,
      onSuccess,
    })
  )

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (text) {
      console.error(`${ts()} ${c.red}[stderr]${c.reset} ${text}`)
      discordLogger.log(`⚠️ [stderr] ${text.slice(0, 300)}`)
    }
  })

  child.on('close', async (code) => {
    onDone?.()
    if (code !== 0 && code !== null) {
      console.log(`${ts()} ${c.red}프로세스 종료 코드: ${code}${c.reset}`)
      discordLogger.log(`프로세스 종료 코드: ${code}`)
    }
    discordLogger.forceFlush()
    await cleanup(tempFiles)
  })

  child.on('error', (err) => {
    const msg = err.message.includes('ENOENT')
      ? "'claude' 명령어를 찾을 수 없습니다. Claude Code CLI 설치를 확인하세요."
      : err.message
    console.error(`${ts()} ${c.red}[오류]${c.reset} ${msg}`)
    discordLogger.log(`[오류] ${msg}`)
    processingMsg.edit(`❌ ${msg}`).catch(() => {})
    discordLogger.forceFlush()
  })

  return child
}

type StreamContext = {
  discordLogger: ReturnType<typeof createDiscordLogger>
  processingMsg: Message
  resultChannel?: { send: (content: string) => Promise<unknown> }
  commandChannel?: { send: (content: string) => Promise<unknown> }
  start: number
  decisionCount: number
  toolIdToNum: Map<string, number>
  toolIdToName: Map<string, string>
  toolStats: Map<string, number>
  onDecisionCount: (n: number) => void
  onSessionId?: (id: string) => void
  onSuccess?: () => Promise<void>
}

function handleStreamLine(line: string, ctx: StreamContext) {
  if (!line.trim()) return
  let event: Record<string, unknown>
  try {
    event = JSON.parse(line)
  } catch {
    return
  }

  switch (event.type) {
    case 'system': {
      const sid = (event as { session_id?: string }).session_id
      if (sid) {
        console.log(`${ts()} ${c.gray}세션: ${sid}${c.reset}`)
        ctx.discordLogger.log(`🔑 세션 ID: ${sid.slice(0, 8)}...`)
        ctx.onSessionId?.(sid)
      }
      break
    }

    case 'assistant': {
      type ContentBlock = { type: string; text?: string; id?: string; name?: string; input?: unknown }
      const content: ContentBlock[] = (event.message as { content: ContentBlock[] }).content ?? []
      const reasoning = content.filter(b => b.type === 'text').map(b => b.text ?? '').join('').trim()
      const toolBlocks = content.filter(b => b.type === 'tool_use')

      if (reasoning) {
        if (toolBlocks.length > 0) {
          // 도구 사용과 함께 나온 판단 근거 → 로그 채널에 전송 (축약)
          const truncated = reasoning.slice(0, 300) + (reasoning.length > 300 ? '...' : '')
          console.log(`\n${ts()} ${c.blue}[판단 근거]${c.reset} ${truncated}`)
          ctx.discordLogger.log(`🤔 [판단] ${truncated}`)
        } else {
          // 도구 없이 나온 텍스트 → 유저 확인/의사결정 필요 → command 채널로 전송
          console.log(`\n${ts()} ${c.blue}[Claude]${c.reset} ${reasoning}`)
          const target = ctx.commandChannel
          if (target) {
            target.send(`💬 **Claude**\n${truncate(reasoning, 1800)}`).catch(() => {})
          } else {
            ctx.discordLogger.log(`💬 ${reasoning}`)
          }
        }
      }

      for (const block of toolBlocks) {
        ctx.decisionCount++
        ctx.onDecisionCount(ctx.decisionCount)
        ctx.toolIdToNum.set(block.id!, ctx.decisionCount)
        ctx.toolIdToName.set(block.id!, block.name!)
        ctx.toolStats.set(block.name!, (ctx.toolStats.get(block.name!) ?? 0) + 1)
        const inputStr = formatToolInput(block.name!, block.input as Record<string, unknown>)
        console.log(`${ts()} ${c.yellow}${c.bold}[결정 #${ctx.decisionCount}]${c.reset} ${c.yellow}${block.name}${c.reset}\n  ${c.cyan}${inputStr}${c.reset}`)
        // 모든 tool call을 로그 채널에 전송 (이전: 5번마다)
        ctx.discordLogger.log(`🔧 [#${ctx.decisionCount}] ${block.name!}: ${inputStr}`)
      }
      break
    }

    case 'user': {
      type ToolResultBlock = { type: string; tool_use_id?: string; content?: unknown }
      const content: ToolResultBlock[] = (event.message as { content: ToolResultBlock[] }).content ?? []
      for (const block of content) {
        if (block.type !== 'tool_result') continue
        const num = ctx.toolIdToNum.get(block.tool_use_id ?? '')
        const name = ctx.toolIdToName.get(block.tool_use_id ?? '') ?? '?'
        const summary = summarizeToolResult(name, block.content)
        console.log(`${ts()} ${c.green}[결과 #${num ?? '?'}]${c.reset} ${name} → ${summary}`)

        const cleanSummary = stripAnsi(summary)
        if (summary.includes('실패') || summary.includes('error')) {
          // 오류는 항상 로그
          ctx.discordLogger.log(`❌ [#${num ?? '?'}] ${name} 오류: ${cleanSummary}`)
        } else {
          // 정상 결과도 로그에 기록
          ctx.discordLogger.log(`✔️ [#${num ?? '?'}] ${name}: ${cleanSummary}`)
        }
      }
      break
    }

    case 'result': {
      const res = event as { subtype: string; result?: string; cost_usd?: number; num_turns?: number }
      const elapsed = ((Date.now() - ctx.start) / 1000).toFixed(1)
      const cost = res.cost_usd != null ? ` | 비용: $${res.cost_usd.toFixed(4)}` : ''
      const turns = res.num_turns != null ? ` | 턴 수: ${res.num_turns}` : ''

      if (res.subtype === 'success') {
        console.log(`\n${ts()} ${c.bold}${c.green}══ 작업 완료 (${elapsed}s${cost}${turns}) ══${c.reset}`)
        if (res.result?.trim()) {
          console.log(`${c.green}최종 결과:${c.reset}\n${res.result.slice(0, 500)}${res.result.length > 500 ? '\n...(생략)' : ''}`)
        }
        const statsStr = ctx.toolStats.size > 0
          ? `\n도구 사용: ${[...ctx.toolStats.entries()].map(([k, v]) => `${k}×${v}`).join(', ')}`
          : ''
        // 로그 채널: 완료 요약
        ctx.discordLogger.log(`✅ 작업 완료 (${elapsed}s${cost}${turns})${statsStr}`)
        ctx.discordLogger.forceFlush()
        // 커맨드 채널: 진행 메시지를 "완료" 표시로 업데이트
        ctx.processingMsg.edit('✅ 작업이 완료되었습니다.').catch(() => {})
        // 결과 채널: 최종 결과 전송
        const finalText = res.result?.trim() ? truncate(res.result, 1800) : '✅ 작업이 완료되었습니다.'
        const resultTarget = ctx.resultChannel ?? (ctx.processingMsg.channel as { send: (content: string) => Promise<unknown> })
        resultTarget.send(finalText).catch(() => {})
        ctx.onSuccess?.().catch((err: Error) => {
          ctx.discordLogger.log(`❌ PR 생성 실패: ${err.message}`)
          ctx.discordLogger.forceFlush()
        })
      } else {
        console.log(`\n${ts()} ${c.bold}${c.red}══ 작업 실패 (${elapsed}s) ══${c.reset}`)
        ctx.discordLogger.log(`❌ 작업 실패 (${elapsed}s)`)
        ctx.discordLogger.forceFlush()
        // 커맨드 채널: 진행 메시지 업데이트
        ctx.processingMsg.edit('❌ 작업이 실패했습니다.').catch(() => {})
        // 결과 채널: 실패 알림
        const resultTarget = ctx.resultChannel ?? (ctx.processingMsg.channel as { send: (content: string) => Promise<unknown> })
        resultTarget.send(`❌ 작업이 실패했습니다. (${elapsed}s)`).catch(() => {})
      }
      break
    }
  }
}
