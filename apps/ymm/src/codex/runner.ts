import { Message } from 'discord.js'
import { spawn } from 'child_process'
import { c, ts, truncate } from '../utils/ansi.js'
import { createDiscordLogger } from '../discord/discordLogger.js'
import { cleanup } from '../discord/attachments.js'
import { CODEX_BIN, PROJECT_ROOT } from '../config.js'

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

type SendFn = (content: string) => Promise<unknown>

type RunOptions = {
  onDone?: () => void
  logChannel?: { send: SendFn }
  resultChannel?: { send: SendFn }
}

export function runCodexCode(
  prompt: string,
  message: Message,
  processingMsg: Message,
  tempFiles: string[],
  { onDone, logChannel, resultChannel }: RunOptions = {},
) {
  const start = Date.now()
  const discordLogger = createDiscordLogger(
    logChannel ?? (message.channel as { send: SendFn }),
  )
  const fullPrompt = WORKFLOW_RULES + prompt

  const child = spawn(CODEX_BIN, ['exec', '--dangerously-bypass-approvals-and-sandbox', fullPrompt], {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let output = ''
  child.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString()
    output += text
    discordLogger.log(`🧠 [codex] ${truncate(text, 500)}`)
  })

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim()
    if (!text) return
    console.error(`${ts()} ${c.red}[codex stderr]${c.reset} ${text}`)
    discordLogger.log(`⚠️ [codex stderr] ${truncate(text, 500)}`)
  })

  child.on('close', async (code) => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    onDone?.()
    await cleanup(tempFiles)
    if (code === 0) {
      processingMsg.edit('✅ Codex 작업이 완료되었습니다.').catch(() => {})
      const resultTarget = resultChannel ?? (message.channel as { send: SendFn })
      const finalText = output.trim() ? truncate(output, 1800) : '✅ Codex 작업이 완료되었습니다.'
      resultTarget.send(finalText).catch(() => {})
      discordLogger.log(`✅ Codex 작업 완료 (${elapsed}s)`)
      discordLogger.forceFlush()
      return
    }
    processingMsg.edit('❌ Codex 작업이 실패했습니다.').catch(() => {})
    discordLogger.log(`❌ Codex 작업 실패 (${elapsed}s, code=${code ?? 'null'})`)
    discordLogger.forceFlush()
  })

  child.on('error', (err) => {
    const msg = err.message.includes('ENOENT')
      ? `'${CODEX_BIN}' 명령어를 찾을 수 없습니다. Codex CLI 설치를 확인하세요.`
      : err.message
    console.error(`${ts()} ${c.red}[오류]${c.reset} ${msg}`)
    discordLogger.log(`[오류] ${msg}`)
    processingMsg.edit(`❌ ${msg}`).catch(() => {})
    discordLogger.forceFlush()
  })

  return child
}
