import { Client, GatewayIntentBits, Message } from 'discord.js'
import { DISCORD_TOKEN, ASSASSIN_PATH, ALLOWED_CHANNEL_IDS } from '../config.js'
import { downloadAttachments, buildPrompt, cleanup } from './attachments.js'
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
  console.log(`assassin 경로: ${ASSASSIN_PATH}`)
  console.log(`허용된 채널: ${ALLOWED_CHANNEL_IDS.length > 0 ? ALLOWED_CHANNEL_IDS.join(', ') : '모든 채널'}`)
})

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return
  if (ALLOWED_CHANNEL_IDS.length > 0 && !ALLOWED_CHANNEL_IDS.includes(message.channelId)) return

  const textPrompt = message.content.trim()
  const hasAttachments = message.attachments.size > 0
  if (!textPrompt && !hasAttachments) return

  const processingMsg = await message.reply('⏳ Claude Code가 작업 중입니다...')

  const tempFiles: string[] = []
  try {
    const attachmentPaths = await downloadAttachments(message, tempFiles)
    const prompt = buildPrompt(textPrompt, attachmentPaths)
    runClaudeCode(prompt, message, processingMsg, tempFiles)
  } catch (err) {
    await processingMsg.edit(`❌ 첨부파일 다운로드 실패: ${(err as Error).message}`)
    await cleanup(tempFiles)
  }
})

export function startBot() {
  client.login(DISCORD_TOKEN)
}
