import { Message } from 'discord.js'
import { ChildProcess, spawn } from 'child_process'
import readline from 'node:readline'
import { PROJECT_ROOT } from '../config.js'
import { truncate } from '../utils/ansi.js'

type SendFn = (content: string) => Promise<unknown>

type RunDesignOptions = {
  logChannel?: { send: SendFn }
  onDesignComplete: (designDoc: string) => Promise<void> | void
  onDone?: () => void
  onError?: (err: Error) => Promise<void> | void
}

const DESIGN_PROMPT_HEADER = `당신은 구현자가 아니라 설계자입니다.
코드 수정/실행/파일 변경 없이 Read/Glob/Grep/Bash(읽기 전용 조회)만 사용하세요.

출력은 반드시 아래 섹션을 모두 포함하세요.
## 목표
## 영향 범위
## 구현 계획
## 완료 조건
## ISSUE_TITLE
## ISSUE_LABEL

제약:
- ISSUE_TITLE은 70자 이내 한 줄
- ISSUE_LABEL은 enhancement 또는 task 중 하나
- 불필요한 서론/결론 없이 설계 문서만 출력
`

function sanitizeReasoningText(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  if (/```/.test(compact)) return ''
  if (/^(diff\s+--git|index\s+[a-f0-9]+|@@\s|\+\+\+\s|---\s)/.test(compact)) return ''
  if (/^[+-].{20,}/.test(compact)) return ''
  if (/(^|\s)(const|let|var|function|class|interface|type|import|export|return|if|for|while|switch|try|catch)\b/.test(compact)) return ''
  if (/=>/.test(compact)) return ''
  if (/^[a-zA-Z_$][\w$]*\s*\(.*\)\s*\{?$/.test(compact)) return ''
  if (/[{}()[\];]/.test(compact) && /[=:]/.test(compact)) return ''
  const noSpace = compact.replace(/\s/g, '')
  const ratio = noSpace.length
    ? ((noSpace.match(/[{}()[\];=<>`$\\]/g) ?? []).length / noSpace.length)
    : 0
  if (compact.length > 80 && ratio > 0.4) return ''
  return compact
}

export function runPoorDevDesign(
  prompt: string,
  _message: Message,
  processingMsg: Message,
  { logChannel, onDesignComplete, onDone, onError }: RunDesignOptions,
): ChildProcess {
  const fullPrompt = `${DESIGN_PROMPT_HEADER}\n\n[요청]\n${prompt}`

  const child = spawn('claude', [
    '-p',
    fullPrompt,
    '--allowedTools',
    'Read,Glob,Grep,Bash',
    '--output-format',
    'stream-json',
    '--verbose',
  ], {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let done = false
  let stderr = ''
  let designDoc = ''
  let fallback = ''

  const finish = () => {
    if (done) return
    done = true
    onDone?.()
  }

  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  rl.on('line', (line) => {
    if (!line.trim()) return

    let event: Record<string, unknown>
    try {
      event = JSON.parse(line)
    } catch {
      return
    }

    if (event.type === 'assistant') {
      type ContentBlock = { type: string; text?: string; thinking?: string }
      const content: ContentBlock[] = (event.message as { content?: ContentBlock[] })?.content ?? []
      const reasoning = content
        .filter((b) => b.type === 'text' || b.type === 'thinking')
        .map((b) => b.text ?? b.thinking ?? '')
        .join('')
        .trim()
      if (reasoning) {
        fallback += reasoning + '\n'
        const safe = sanitizeReasoningText(reasoning)
        if (safe) {
          const text = truncate(safe, 250)
          logChannel?.send(`🧠 [poor-dev/design] ${text}`).catch(() => {})
        }
      }
      return
    }

    if (event.type === 'result') {
      const result = event as { subtype?: string; result?: unknown }
      if (result.subtype === 'success') {
        if (typeof result.result === 'string' && result.result.trim()) {
          designDoc = result.result.trim()
          return
        }
        if (result.result != null) {
          const fallbackResult = typeof result.result === 'object'
            ? JSON.stringify(result.result, null, 2)
            : String(result.result)
          if (fallbackResult.trim()) designDoc = fallbackResult.trim()
        }
      }
    }
  })

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (!text) return
    stderr += text + '\n'
    logChannel?.send(`⚠️ [poor-dev/design stderr] ${truncate(text, 400)}`).catch(() => {})
  })

  child.on('close', async (code) => {
    try {
      if (code !== 0) {
        const msg = stderr.trim() || `설계 단계 실패 (code=${code ?? 'null'})`
        await processingMsg.edit(`❌ ${truncate(msg, 1800)}`).catch(() => {})
        await onError?.(new Error(msg))
        return
      }

      const finalDoc = (designDoc || fallback || '').trim()
      if (!finalDoc) {
        const msg = '설계 문서를 생성하지 못했습니다.'
        await processingMsg.edit(`❌ ${msg}`).catch(() => {})
        await onError?.(new Error(msg))
        return
      }

      await onDesignComplete(finalDoc)
    } finally {
      finish()
    }
  })

  child.on('error', async (err) => {
    const msg = err.message.includes('ENOENT')
      ? "'claude' 명령어를 찾을 수 없습니다. Claude CLI 설치를 확인하세요."
      : err.message
    await processingMsg.edit(`❌ ${msg}`).catch(() => {})
    await onError?.(new Error(msg))
    finish()
  })

  return child
}
