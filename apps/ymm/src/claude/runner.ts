import { Message } from 'discord.js'
import { spawn } from 'child_process'
import readline from 'node:readline'
import { c, ts, stripAnsi, truncate } from '../utils/ansi.js'
import { formatToolInput, summarizeToolResult } from './formatter.js'
import { createDiscordLogger } from '../discord/discordLogger.js'
import { cleanup } from '../discord/attachments.js'
import { ASSASSIN_PATH } from '../config.js'

export function runClaudeCode(prompt: string, message: Message, processingMsg: Message, tempFiles: string[]) {
  const start = Date.now()
  const discordLogger = createDiscordLogger(message.channel as { send: (content: string) => Promise<unknown> })

  const promptPreview = prompt.slice(0, 100) + (prompt.length > 100 ? '...' : '')
  console.log(`\n${ts()} ${c.bold}${c.cyan}══ 작업 시작 ══${c.reset}`)
  console.log(`${ts()} ${c.cyan}프롬프트:${c.reset} "${promptPreview}"`)
  discordLogger.log(`\n══ 작업 시작 ══\n프롬프트: "${promptPreview}"`)

  const child = spawn(
    'claude',
    ['-p', prompt, '--allowedTools', 'Read,Edit,Bash,Glob,Grep', '--output-format', 'stream-json', '--verbose'],
    { cwd: ASSASSIN_PATH, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] }
  )

  let decisionCount = 0
  const toolIdToNum = new Map<string, number>()
  const toolIdToName = new Map<string, string>()

  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  rl.on('line', (line) => handleStreamLine(line, { discordLogger, processingMsg, start, decisionCount, toolIdToNum, toolIdToName, onDecisionCount: (n) => { decisionCount = n } }))

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (text) {
      console.error(`${ts()} ${c.red}[stderr]${c.reset} ${text}`)
      discordLogger.log(`[stderr] ${text}`)
    }
  })

  child.on('close', async (code) => {
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
  start: number
  decisionCount: number
  toolIdToNum: Map<string, number>
  toolIdToName: Map<string, string>
  onDecisionCount: (n: number) => void
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
        ctx.discordLogger.log(`세션: ${sid}`)
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
          ctx.discordLogger.log(`[판단 근거] ${truncated}`)
        } else {
          console.log(`\n${ts()} ${c.blue}[Claude]${c.reset} ${reasoning}`)
          ctx.discordLogger.log(`[Claude] ${reasoning}`)
        }
      }

      for (const block of toolBlocks) {
        ctx.decisionCount++
        ctx.onDecisionCount(ctx.decisionCount)
        ctx.toolIdToNum.set(block.id!, ctx.decisionCount)
        ctx.toolIdToName.set(block.id!, block.name!)
        const inputStr = formatToolInput(block.name!, block.input as Record<string, unknown>)
        console.log(`${ts()} ${c.yellow}${c.bold}[결정 #${ctx.decisionCount}]${c.reset} ${c.yellow}${block.name}${c.reset}\n  ${c.cyan}${inputStr}${c.reset}`)
        ctx.discordLogger.log(`[결정 #${ctx.decisionCount}] ${block.name}\n  ${inputStr}`)
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
        ctx.discordLogger.log(`[결과 #${num ?? '?'}] ${name} → ${stripAnsi(summary)}`)
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
        ctx.discordLogger.log(`\n══ 작업 완료 (${elapsed}s${cost}${turns}) ══`)
        ctx.discordLogger.forceFlush()
        const finalText = res.result?.trim() ? truncate(res.result, 1800) : '✅ 작업이 완료되었습니다.'
        ctx.processingMsg.edit(finalText).catch(() => {})
      } else {
        console.log(`\n${ts()} ${c.bold}${c.red}══ 작업 실패 (${elapsed}s) ══${c.reset}`)
        ctx.discordLogger.log(`\n══ 작업 실패 (${elapsed}s) ══`)
        ctx.discordLogger.forceFlush()
        ctx.processingMsg.edit('❌ 작업이 실패했습니다.').catch(() => {})
      }
      break
    }
  }
}
