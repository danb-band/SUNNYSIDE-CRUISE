import { Message } from 'discord.js'
import { spawn } from 'child_process'
import readline from 'node:readline'
import { c, ts, truncate } from '../utils/ansi.js'
import { createDiscordLogger } from '../discord/discordLogger.js'
import { cleanup } from '../discord/attachments.js'
import { CODEX_BIN, PROJECT_ROOT } from '../config.js'
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

// codex가 승인을 요청할 때 출력하는 패턴
const APPROVAL_RE = /\[y\/n\]|\[Y\/n\]|\[y\/N\]|\(y\/n\)|\(Y\/n\)/i
const SESSION_ID_RE = /session id:\s*([0-9a-f-]{36})/i

type SendFn = (content: string) => Promise<unknown>

type RunOptions = {
  sessionId?: string
  onSessionId?: (id: string) => void
  onDone?: () => void
  logChannel?: { send: SendFn }
  resultChannel?: { send: SendFn }
  commandChannel?: { send: SendFn }
  /** 승인 요청 발생 시 호출. 'y' 또는 'n'을 resolve해야 함 */
  onApprovalRequest?: (prompt: string) => Promise<string>
}

export function runCodexCode(
  prompt: string,
  message: Message,
  processingMsg: Message,
  tempFiles: string[],
  { sessionId, onSessionId, onDone, logChannel, resultChannel, commandChannel, onApprovalRequest }: RunOptions = {},
) {
  const start = Date.now()
  const discordLogger = createDiscordLogger(
    logChannel ?? (message.channel as { send: SendFn }),
  )
  const baseContext = sessionId ? '' : WORKFLOW_RULES + buildSharedAgentContextPrompt({ projectRoot: PROJECT_ROOT })
  const fullPrompt = baseContext + prompt

  // dangerously-bypass-approvals-and-sandbox: 샌드박스 없이 실행
  // 이 봇은 전용 레포 안에서만 동작하므로 샌드박스 우회가 적합함
  // (--full-auto의 workspace-write 샌드박스는 .git/ 쓰기를 막아 git pull이 불가)
  const args = ['exec', '--dangerously-bypass-approvals-and-sandbox']
  if (sessionId) {
    args.push('resume', sessionId)
  }
  args.push(fullPrompt)
  const child = spawn(CODEX_BIN, args, {
    cwd: PROJECT_ROOT,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  // stdin을 즉시 닫아 codex가 "Reading additional input from stdin..." 상태에서 블로킹되지 않도록 함
  child.stdin.end()

  let output = ''

  const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
  rl.on('line', (line) => {
    output += line + '\n'
    discordLogger.log(`🧠 [codex] ${truncate(line, 500)}`)

    const sessionMatch = line.match(SESSION_ID_RE)
    if (sessionMatch?.[1] && onSessionId) {
      onSessionId(sessionMatch[1])
    }

    if (APPROVAL_RE.test(line)) {
      console.log(`${ts()} ${c.yellow}[codex 승인 요청]${c.reset} ${line}`)
      const target = commandChannel ?? (message.channel as { send: SendFn })
      target
        .send(`❓ **Codex 승인 요청**\n\`\`\`\n${truncate(line, 500)}\n\`\`\`\n\`y\` 또는 \`n\`으로 답해주세요. (60초 내 무응답 시 자동으로 \`n\`)`)
        .catch(() => {})

      if (onApprovalRequest) {
        onApprovalRequest(line)
          .then((response) => {
            child.stdin.write(response.trim() + '\n')
            discordLogger.log(`✅ [승인 응답] ${response.trim()}`)
          })
          .catch(() => {
            child.stdin.write('n\n')
          })
      } else {
        // 콜백 없으면 자동으로 'n' 응답
        child.stdin.write('n\n')
      }
    }
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
