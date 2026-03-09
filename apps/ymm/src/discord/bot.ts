import { Client, GatewayIntentBits, Message } from 'discord.js'
import { DISCORD_TOKEN, PROJECT_ROOT, ALLOWED_CHANNEL_IDS } from '../config.js'
import { downloadAttachments, buildPrompt, cleanup } from './attachments.js'
import { getSession, setSession, clearSession } from './sessionStore.js'
import { killProcess, setProcess, clearProcess } from './processStore.js'
import { runClaudeCode } from '../claude/runner.js'

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
