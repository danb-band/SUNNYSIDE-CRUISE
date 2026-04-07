import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js'
import { execSync } from 'child_process'
import { DISCORD_TOKEN, PROJECT_ROOT, DISCORD_COMMAND_ID, DISCORD_RESULT_ID, DISCORD_LOG_ID } from '../config.js'
import { downloadAttachments, buildPrompt, cleanup } from './attachments.js'
import { getSession, setSession, clearSession } from './sessionStore.js'
import { killProcess, getProcess, setProcess, clearProcess } from './processStore.js'
import { runClaudeCode } from '../claude/runner.js'
import { runCodexCode } from '../codex/runner.js'
import { fetchIssue, buildIssuePrompt, createPR } from '../github/client.js'
import { splitIntoChunks } from '../utils/ansi.js'
import { getAgent, setAgent } from './agentStore.js'

const COMMANDS = [
  { name: '!done',         desc: '현재 세션 종료 (다음 메시지부터 새 작업으로 시작)' },
  { name: '!stop',         desc: '실행 중인 작업 강제 종료 + 세션 초기화' },
  { name: '!session',      desc: '현재 활성 세션 ID 확인' },
  { name: '!agent',        desc: '현재 에이전트 확인 또는 변경 (!agent claude | !agent codex)' },
  { name: '!cost',         desc: 'Claude Code 세션의 토큰 사용량 확인' },
  { name: '#숫자',         desc: 'GitHub 이슈 번호로 Claude Code 작업 시작 (예: #42)' },
  { name: 'team N:작업',  desc: 'N개 워커로 멀티 에이전트 병렬 실행 (예: team 3:버튼 컴포넌트 리팩터)' },
  { name: '/help',         desc: '명령어 목록 보기' },
]

const ISSUE_PATTERN = /^#(\d+)$/

/** 채널 ID로 TextChannel을 가져옵니다. 없으면 undefined를 반환합니다. */
function getTextChannel(id: string): TextChannel | undefined {
  if (!id) return undefined
  const ch = client.channels.cache.get(id)
  return ch instanceof TextChannel ? ch : undefined
}

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

client.once('ready', () => {
  console.log(`봇 로그인 완료: ${client.user?.tag}`)
  console.log(`프로젝트 루트: ${PROJECT_ROOT}`)
  console.log(`명령 채널: ${DISCORD_COMMAND_ID || '(미설정)'}`)
  console.log(`결과 채널: ${DISCORD_RESULT_ID || '(미설정)'}`)
  console.log(`로그 채널:  ${DISCORD_LOG_ID || '(미설정)'}`)
})

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return
  // 명령 채널이 설정된 경우 해당 채널에서만 수신
  if (DISCORD_COMMAND_ID && message.channelId !== DISCORD_COMMAND_ID) return

  const text = message.content.trim()

  // !stop — 실행 중인 Claude 프로세스 강제 종료 + 세션 초기화
  if (text === '!stop') {
    const killed = killProcess(message.channelId)
    clearSession(message.channelId)
    await message.reply(killed
      ? '🛑 실행 중인 작업을 중단했습니다. 세션도 초기화되었습니다.'
      : '실행 중인 작업이 없습니다.')
    return
  }

  // !done — 현재 채널의 세션 종료
  if (text === '!done') {
    clearSession(message.channelId)
    await message.reply('🔄 세션이 초기화되었습니다. 다음 메시지부터 새 작업으로 시작합니다.')
    return
  }

  // !session — 현재 세션 ID 확인
  if (text === '!session') {
    const sid = getSession(message.channelId)
    await message.reply(sid ? `현재 세션: \`${sid}\`` : '활성 세션 없음.')
    return
  }

  // !agent — 현재 에이전트 확인 / 변경
  if (text === '!agent' || text === '!agent claude' || text === '!agent codex') {
    if (text === '!agent') {
      await message.reply(`현재 에이전트: **${getAgent(message.channelId)}**`)
      return
    }
    const nextAgent = text.endsWith('codex') ? 'codex' : 'claude'
    setAgent(message.channelId, nextAgent)
    await message.reply(`✅ 현재 채널 에이전트가 **${nextAgent}** 로 변경되었습니다.`)
    return
  }

  // !cost — Claude Code /context 출력
  if (text === '!cost') {
    if (getAgent(message.channelId) !== 'claude') {
      await message.reply('ℹ️ `!cost`는 Claude 에이전트에서만 지원됩니다.')
      return
    }
    const sid = getSession(message.channelId)
    try {
      const resumeFlag = sid ? `--resume ${sid} ` : ''
      const output = execSync(`claude ${resumeFlag}-p "/context"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 15000,
      }).trim()
      if (!output) {
        await message.reply('비용 정보를 가져올 수 없습니다.')
      } else {
        const chunks = splitIntoChunks(output, 1800)
        for (const chunk of chunks) {
          await message.reply('```\n' + chunk + '\n```')
        }
      }
    } catch (err) {
      await message.reply(`❌ 비용 조회 실패: ${(err as Error).message}`)
    }
    return
  }

  // /help — 사용 가능한 명령어 목록
  if (text === '/help') {
    const lines = COMMANDS.map(c => `\`${c.name}\` — ${c.desc}`)
    await message.reply('**Claude CLI 세션 명령어**\n' + lines.join('\n'))
    return
  }

  // 작업 중 거부 — 이미 실행 중인 프로세스가 있으면 새 작업 차단
  if (getProcess(message.channelId)) {
    await message.reply('⚠️ 이미 작업이 진행 중입니다. `!stop`으로 중단 후 재시도하세요.')
    return
  }

  // #42 — GitHub 이슈 번호로 Claude Code 실행
  const issueMatch = text.match(ISSUE_PATTERN)
  if (issueMatch) {
    const issueNumber = parseInt(issueMatch[1], 10)
    const fetchingMsg = await message.reply(`🔍 GitHub Issue #${issueNumber} 가져오는 중...`)
    let issue
    try {
      issue = await fetchIssue(issueNumber)
    } catch (err) {
      await fetchingMsg.edit(`❌ ${(err as Error).message}`)
      return
    }

    // dev 브랜치로 체크아웃 후 최신 코드 pull
    try {
      execSync(`git -C "${PROJECT_ROOT}" checkout dev`, { stdio: 'pipe' })
      execSync(`git -C "${PROJECT_ROOT}" pull origin dev`, { stdio: 'pipe' })
    } catch (err) {
      await fetchingMsg.edit(`❌ dev 브랜치 동기화 실패: ${(err as Error).message}`)
      return
    }

    // feature 브랜치 생성
    const branchName = `feat/issue-${issue.number}`
    try {
      execSync(`git -C "${PROJECT_ROOT}" checkout -b ${branchName}`, { stdio: 'pipe' })
    } catch {
      try {
        execSync(`git -C "${PROJECT_ROOT}" checkout ${branchName}`, { stdio: 'pipe' })
      } catch (err) {
        await fetchingMsg.edit(`❌ 브랜치 생성 실패: ${(err as Error).message}`)
        return
      }
    }

    const issuePrompt = buildIssuePrompt(issue)
    await fetchingMsg.edit(`📋 **Issue #${issue.number}: ${issue.title}**\n> \`${branchName}\` 브랜치에서 작업을 시작합니다...`)

    const processingMsg = fetchingMsg
    const sessionId = getSession(message.channelId)
    const logChannel = getTextChannel(DISCORD_LOG_ID)
    const resultChannel = getTextChannel(DISCORD_RESULT_ID)
    const commandChannel = getTextChannel(DISCORD_COMMAND_ID)
    const child = runClaudeCode(issuePrompt, message, processingMsg, [], {
      sessionId,
      onSessionId: (id) => setSession(message.channelId, id),
      onDone: () => clearProcess(message.channelId),
      logChannel,
      resultChannel,
      commandChannel,
      onSuccess: async () => {
        const target = resultChannel ?? message.channel as TextChannel
        try {
          const pr = await createPR(issue, branchName)
          await target.send(`🎉 PR이 생성되었습니다! **#${pr.number}**\n${pr.url}`)
        } catch (err) {
          await target.send(`❌ PR 자동 생성 실패: ${(err as Error).message}`)
        }
      },
    })
    setProcess(message.channelId, child)
    return
  }

  const hasAttachments = message.attachments.size > 0
  if (!text && !hasAttachments) return

  const agent = getAgent(message.channelId)
  const processingMsg = await message.reply(
    agent === 'claude' ? '⏳ Claude Code가 작업 중입니다...' : '⏳ Codex가 작업 중입니다...',
  )

  const sessionId = getSession(message.channelId)

  const tempFiles: string[] = []
  try {
    const attachmentPaths = await downloadAttachments(message, tempFiles)
    const prompt = buildPrompt(text, attachmentPaths)
    const child = agent === 'claude'
      ? runClaudeCode(prompt, message, processingMsg, tempFiles, {
          sessionId,
          onSessionId: (id) => setSession(message.channelId, id),
          onDone: () => clearProcess(message.channelId),
          logChannel: getTextChannel(DISCORD_LOG_ID),
          resultChannel: getTextChannel(DISCORD_RESULT_ID),
          commandChannel: getTextChannel(DISCORD_COMMAND_ID),
        })
      : runCodexCode(prompt, message, processingMsg, tempFiles, {
          sessionId,
          onSessionId: (id) => setSession(message.channelId, id),
          onDone: () => clearProcess(message.channelId),
          logChannel: getTextChannel(DISCORD_LOG_ID),
          resultChannel: getTextChannel(DISCORD_RESULT_ID),
          commandChannel: getTextChannel(DISCORD_COMMAND_ID),
          onApprovalRequest: (_approvalPrompt) => {
            const ch = getTextChannel(DISCORD_COMMAND_ID) ?? (message.channel as TextChannel)
            return new Promise((resolve) => {
              const collector = ch.createMessageCollector({
                filter: (m: Message) => !m.author.bot && /^[yn]$/i.test(m.content.trim()),
                max: 1,
                time: 60_000,
              })
              collector.on('collect', (m: Message) => resolve(m.content.trim()))
              collector.on('end', (_collected: unknown, reason: string) => {
                if (reason === 'time') resolve('n')
              })
            })
          },
        })
    setProcess(message.channelId, child)
  } catch (err) {
    await processingMsg.edit(`❌ 첨부파일 다운로드 실패: ${(err as Error).message}`)
    await cleanup(tempFiles)
  }
})

export function startBot() {
  client.login(DISCORD_TOKEN)
}
