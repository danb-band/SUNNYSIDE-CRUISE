import { Message } from 'discord.js'
import { spawn } from 'child_process'
import readline from 'node:readline'
import { c, ts, stripAnsi, truncate } from '../utils/ansi.js'
import { formatToolInput, summarizeToolResult } from './formatter.js'
import { createDiscordLogger } from '../discord/discordLogger.js'
import { cleanup } from '../discord/attachments.js'
import { PROJECT_ROOT } from '../config.js'

const COMMIT_INSTRUCTIONS = `

---
[커밋 규칙]
- 작업이 끝나면 반드시 git commit을 생성하세요.
- 작업이 여러 기능을 포함한다면 기능 단위로 나눠서 각각 커밋하세요.
- 커밋 메시지는 "feat: ...", "fix: ...", "refactor: ..." 등 conventional commit 형식으로 한국어로 작성하세요.
- 커밋 전 git status로 변경 파일을 확인하고, 관련 파일만 stage하세요.
`

type RunOptions = {
  sessionId?: string          // 이어갈 세션 ID (없으면 새 세션)
  onSessionId?: (id: string) => void  // 세션 ID 획득 시 콜백
  onDone?: () => void         // 프로세스 종료 시 콜백
  onSuccess?: () => Promise<void>     // 작업 성공 시 콜백
}

export function runClaudeCode(
  prompt: string,
  message: Message,
  processingMsg: Message,
  tempFiles: string[],
  { sessionId, onSessionId, onDone, onSuccess }: RunOptions = {}
) {
  const start = Date.now()
  const discordLogger = createDiscordLogger(message.channel as { send: (content: string) => Promise<unknown> })

  const promptPreview = prompt.slice(0, 100) + (prompt.length > 100 ? '...' : '')
  const sessionLabel = sessionId ? ` (세션 재개: ${sessionId.slice(0, 8)}...)` : ' (새 세션)'
  console.log(`\n${ts()} ${c.bold}${c.cyan}══ 작업 시작${sessionLabel} ══${c.reset}`)
  console.log(`${ts()} ${c.cyan}프롬프트:${c.reset} "${promptPreview}"`)
  discordLogger.log(`\n══ 작업 시작${sessionLabel} ══\n프롬프트: "${promptPreview}"`)

  const fullPrompt = prompt + COMMIT_INSTRUCTIONS

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

const PROGRESS_INTERVAL = 5  // N번 툴 호출마다 Discord에 진행상황 전송

type StreamContext = {
  discordLogger: ReturnType<typeof createDiscordLogger>
  processingMsg: Message
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
          const truncated = reasoning.slice(0, 300) + (reasoning.length > 300 ? '...' : '')
          console.log(`\n${ts()} ${c.blue}[판단 근거]${c.reset} ${truncated}`)
        } else {
          console.log(`\n${ts()} ${c.blue}[Claude]${c.reset} ${reasoning}`)
          ctx.discordLogger.log(`💬 ${reasoning}`)
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

        if (ctx.decisionCount % PROGRESS_INTERVAL === 0) {
          const elapsed = ((Date.now() - ctx.start) / 1000).toFixed(0)
          const statsStr = [...ctx.toolStats.entries()].map(([k, v]) => `${k}×${v}`).join(', ')
          ctx.discordLogger.log(`🔄 작업 중... (${elapsed}s | ${statsStr})`)
        }
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

        if (summary.includes('실패') || summary.includes('error')) {
          ctx.discordLogger.log(`⚠️ ${name} 오류: ${stripAnsi(summary)}`)
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
        ctx.discordLogger.log(`✅ 작업 완료 (${elapsed}s${cost}${turns})${statsStr}`)
        ctx.discordLogger.forceFlush()
        const finalText = res.result?.trim() ? truncate(res.result, 1800) : '✅ 작업이 완료되었습니다.'
        ctx.processingMsg.edit(finalText).catch(() => {})
        ctx.onSuccess?.().catch((err: Error) => {
          ctx.discordLogger.log(`❌ PR 생성 실패: ${err.message}`)
          ctx.discordLogger.forceFlush()
        })
      } else {
        console.log(`\n${ts()} ${c.bold}${c.red}══ 작업 실패 (${elapsed}s) ══${c.reset}`)
        ctx.discordLogger.log(`❌ 작업 실패 (${elapsed}s)`)
        ctx.discordLogger.forceFlush()
        ctx.processingMsg.edit('❌ 작업이 실패했습니다.').catch(() => {})
      }
      break
    }
  }
}
