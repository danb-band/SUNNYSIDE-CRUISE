import { Client, GatewayIntentBits, Message } from 'discord.js'
import { execSync } from 'child_process'
import { DISCORD_TOKEN, PROJECT_ROOT, ALLOWED_CHANNEL_IDS } from '../config.js'
import { downloadAttachments, buildPrompt, cleanup } from './attachments.js'
import { getSession, setSession, clearSession } from './sessionStore.js'
import { killProcess, getProcess, setProcess, clearProcess } from './processStore.js'
import { runClaudeCode } from '../claude/runner.js'
import { fetchIssue, buildIssuePrompt, createPR } from '../github/client.js'

const COMMANDS = [
  { name: '!done',    desc: '현재 세션 종료 (다음 메시지부터 새 작업으로 시작)' },
  { name: '!stop',    desc: '실행 중인 작업 강제 종료 + 세션 초기화' },
  { name: '!session', desc: '현재 활성 세션 ID 확인' },
  { name: '#42',      desc: 'GitHub 이슈 번호로 Claude Code 작업 시작' },
  { name: '/help',    desc: '명령어 목록 보기' },
]

const ISSUE_PATTERN = /^#(\d+)$/

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
  console.log(`허용된 채널: ${ALLOWED_CHANNEL_IDS.length > 0 ? ALLOWED_CHANNEL_IDS.join(', ') : '모든 채널'}`)
})

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return
  if (ALLOWED_CHANNEL_IDS.length > 0 && !ALLOWED_CHANNEL_IDS.includes(message.channelId)) return

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
    const child = runClaudeCode(issuePrompt, message, processingMsg, [], {
      sessionId,
      onSessionId: (id) => setSession(message.channelId, id),
      onDone: () => clearProcess(message.channelId),
      onSuccess: async () => {
        try {
          const pr = await createPR(issue, branchName)
          await message.reply(`🎉 PR이 생성되었습니다! **#${pr.number}**\n${pr.url}`)
        } catch (err) {
          await message.reply(`❌ PR 자동 생성 실패: ${(err as Error).message}`)
        }
      },
    })
    setProcess(message.channelId, child)
    return
  }

  const hasAttachments = message.attachments.size > 0
  if (!text && !hasAttachments) return

  const processingMsg = await message.reply('⏳ Claude Code가 작업 중입니다...')

  const sessionId = getSession(message.channelId)

  const tempFiles: string[] = []
  try {
    const attachmentPaths = await downloadAttachments(message, tempFiles)
    const prompt = buildPrompt(text, attachmentPaths)
    const child = runClaudeCode(prompt, message, processingMsg, tempFiles, {
      sessionId,
      onSessionId: (id) => setSession(message.channelId, id),
      onDone: () => clearProcess(message.channelId),
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
