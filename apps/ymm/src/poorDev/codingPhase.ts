import { Message } from 'discord.js'
import { ChildProcess, spawn } from 'child_process'
import readline from 'node:readline'
import { CODEX_BIN, PROJECT_ROOT } from '../config.js'
import { truncate } from '../utils/ansi.js'
import { filterCodingLine, resetCodingLogFilterState } from './logFilter.js'

type SendFn = (content: string) => Promise<unknown>

type RunCodingOptions = {
  logChannel?: { send: SendFn }
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
    '위 요청과 설계를 기준으로 구현을 완료하세요. 테스트/빌드 확인까지 수행하고 최종 요약을 남기세요.',
  ].join('\n')
}

export function runPoorDevCoding(
  issueNumber: number,
  designDoc: string,
  originalPrompt: string,
  processingMsg: Message,
  { logChannel, onWorkLogEntry, onDone, onClose, onError }: RunCodingOptions,
): ChildProcess {
  const prompt = buildCodexPrompt(issueNumber, designDoc, originalPrompt)
  resetCodingLogFilterState()

  const child = spawn(
    CODEX_BIN,
    ['exec', '--dangerously-bypass-approvals-and-sandbox', prompt],
    {
      cwd: PROJECT_ROOT,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  rl.on('line', (line) => {
    const raw = line.replace(/\r/g, '')

    const filtered = filterCodingLine(raw)
    if (!filtered.emit || !filtered.text) return

    logChannel?.send(`🧠 [poor-dev/coding] ${truncate(filtered.text, 250)}`).catch(() => {})
    onWorkLogEntry?.(filtered.text)
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
    if (code === 0) {
      await processingMsg.edit('✅ poor-dev 코딩 단계가 완료되었습니다.').catch(() => {})
    } else {
      await processingMsg.edit(`❌ poor-dev 코딩 단계 실패 (code=${code ?? 'null'})`).catch(() => {})
    }
    await onClose?.(code)
  })

  child.on('error', async (err) => {
    const msg = err.message.includes('ENOENT')
      ? `'${CODEX_BIN}' 명령어를 찾을 수 없습니다. Codex CLI 설치를 확인하세요.`
      : err.message
    await processingMsg.edit(`❌ ${msg}`).catch(() => {})
    await onError?.(new Error(msg))
    onDone?.()
  })

  return child
}
