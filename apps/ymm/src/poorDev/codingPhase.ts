import { Message } from 'discord.js'
import { ChildProcess, spawn } from 'child_process'
import readline from 'node:readline'
import { PROJECT_ROOT } from '../config.js'
import { truncate } from '../utils/ansi.js'
import { filterCodingLine, resetCodingLogFilterState } from './logFilter.js'
import { buildSharedAgentContextPrompt } from '../sharedAgentContext.js'

type SendFn = (content: string) => Promise<unknown>

type RunCodingOptions = {
  logChannel?: { send: SendFn }
  sessionId?: string
  onSessionId?: (id: string) => void
  onWorkLogEntry?: (line: string) => void
  onDone?: () => void
  onClose?: (code: number | null) => Promise<void> | void
  onError?: (err: Error) => Promise<void> | void
}

function buildCodexPrompt(issueNumber: number, designDoc: string, originalPrompt: string): string {
  return [
    `GitHub Issue #${issueNumber}`,
    '',
    '[원본 요청]',
    originalPrompt,
    '',
    '[설계 문서]',
    designDoc,
    '',
    '[작업 규칙]',
    '1. 반드시 설계 문서의 구현 계획 순서를 따르세요.',
    '2. 각 단계를 완료할 때마다 관련 파일만 선별 stage 후 커밋하세요.',
    '3. 커밋 메시지는 feat(<scope>): <설명> 형식을 사용하세요.',
    '4. 영향 범위 밖의 파일은 수정하지 마세요.',
    '5. 테스트/빌드 검증 후 완료 조건을 하나씩 체크하고 종료하세요.',
    '',
    '위 요청과 설계를 기준으로 구현을 완료하고, 최종 요약에는 단계별 변경/커밋/검증 결과를 포함하세요.',
  ].join('\n')
}

export function runPoorDevCoding(
  issueNumber: number,
  designDoc: string,
  originalPrompt: string,
  processingMsg: Message,
  { logChannel, sessionId, onSessionId, onWorkLogEntry, onDone, onClose, onError }: RunCodingOptions,
): ChildProcess {
  const prompt = `${buildSharedAgentContextPrompt({ projectRoot: PROJECT_ROOT })}\n${buildCodexPrompt(issueNumber, designDoc, originalPrompt)}`
  resetCodingLogFilterState()

  const args = sessionId
    ? ['--resume', sessionId, '-p', prompt]
    : ['-p', prompt]
  args.push('--allowedTools', 'Read,Write,Edit,Bash,Glob,Grep', '--output-format', 'stream-json', '--verbose')

  const child = spawn('claude', args, {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let resultCode: number | null = 1

  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  rl.on('line', (line) => {
    if (!line.trim()) return
    let event: Record<string, unknown>
    try {
      event = JSON.parse(line)
    } catch {
      return
    }

    if (event.type === 'system') {
      const sid = (event as { session_id?: unknown }).session_id
      if (typeof sid === 'string' && sid.trim()) onSessionId?.(sid.trim())
      return
    }

    if (event.type === 'assistant') {
      type ContentBlock = { type: string; text?: string; thinking?: string }
      const content: ContentBlock[] = (event.message as { content?: ContentBlock[] })?.content ?? []
      const text = content
        .filter((b) => b.type === 'text' || b.type === 'thinking')
        .map((b) => b.text ?? b.thinking ?? '')
        .join('\n')
        .trim()
      if (!text) return

      const lines = text.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
      for (const raw of lines) {
        const filtered = filterCodingLine(raw)
        if (!filtered.emit || !filtered.text) continue
        const safe = truncate(filtered.text, 250)
        logChannel?.send(`🧠 [poor-dev/coding] ${safe}`).catch(() => {})
        onWorkLogEntry?.(safe)
      }
      return
    }

    if (event.type === 'result') {
      const result = event as { subtype?: string; result?: unknown }
      if (result.subtype === 'success') {
        resultCode = 0
        const summary = typeof result.result === 'string'
          ? result.result
          : JSON.stringify(result.result ?? '', null, 2)
        const lines = summary.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
        for (const raw of lines) {
          const filtered = filterCodingLine(raw)
          if (!filtered.emit || !filtered.text) continue
          const safe = truncate(filtered.text, 250)
          logChannel?.send(`🧠 [poor-dev/coding] ${safe}`).catch(() => {})
          onWorkLogEntry?.(safe)
        }
      } else {
        resultCode = 1
      }
    }
  })

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    for (const line of lines) {
      const filtered = filterCodingLine(line)
      if (!filtered.emit || !filtered.text) continue
      const safe = truncate(filtered.text, 300)
      logChannel?.send(`⚠️ [poor-dev/coding stderr] ${safe}`).catch(() => {})
      onWorkLogEntry?.(`오류: ${safe}`)
    }
  })

  child.on('close', async (code) => {
    onDone?.()
    const finalCode = code === 0
      ? (resultCode ?? 1)
      : (code ?? resultCode ?? 1)
    if (finalCode === 0) {
      await processingMsg.edit('✅ poor-dev 코딩 단계가 완료되었습니다.').catch(() => {})
    } else {
      await processingMsg.edit(`❌ poor-dev 코딩 단계 실패 (code=${finalCode ?? 'null'})`).catch(() => {})
    }
    await onClose?.(finalCode)
  })

  child.on('error', async (err) => {
    const msg = err.message.includes('ENOENT')
      ? "'claude' 명령어를 찾을 수 없습니다. Claude Code CLI 설치를 확인하세요."
      : err.message
    await processingMsg.edit(`❌ ${msg}`).catch(() => {})
    await onError?.(new Error(msg))
    onDone?.()
  })

  return child
}
