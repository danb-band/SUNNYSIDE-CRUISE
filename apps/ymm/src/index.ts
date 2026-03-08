import 'dotenv/config'
import { Client, GatewayIntentBits, Message } from 'discord.js'
import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const ASSASSIN_PATH =
  process.env.ASSASSIN_PATH ?? path.resolve(__dirname, '../../assassin')
const ALLOWED_CHANNEL_IDS = process.env.ALLOWED_CHANNEL_IDS
  ? process.env.ALLOWED_CHANNEL_IDS.split(',').map((id) => id.trim())
  : []

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN이 설정되지 않았습니다. .env 파일을 확인하세요.')
  process.exit(1)
}

const client = new Client({
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

async function downloadAttachments(message: Message, tempFiles: string[]): Promise<string[]> {
  const paths: string[] = []
  for (const attachment of message.attachments.values()) {
    const ext = path.extname(attachment.name ?? '') || ''
    const tmpPath = path.join(os.tmpdir(), `discord-${attachment.id}${ext}`)
    const res = await fetch(attachment.url)
    const buffer = Buffer.from(await res.arrayBuffer())
    await writeFile(tmpPath, buffer)
    tempFiles.push(tmpPath)
    paths.push(tmpPath)
  }
  return paths
}

function buildPrompt(text: string, attachmentPaths: string[]): string {
  if (attachmentPaths.length === 0) return text
  const fileList = attachmentPaths.map((p) => `- ${p}`).join('\n')
  if (text) return `${text}\n\n첨부파일:\n${fileList}`
  return `다음 첨부파일을 참고해줘:\n${fileList}`
}

function runClaudeCode(prompt: string, message: Message, processingMsg: Message, tempFiles: string[]) {
  const output: string[] = []
  const errors: string[] = []

  const start = Date.now()
  console.log(`[${timestamp()}] 작업 시작: ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}`)

  const child = spawn(
    'claude',
    ['-p', prompt, '--dangerously-skip-permissions', '--output-format', 'stream-json', '--verbose'],
    {
      cwd: ASSASSIN_PATH,
      env: { ...process.env },
    }
  )

  child.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const event = JSON.parse(line)
        logStreamEvent(event)
        if (event.type === 'result') output.push(event.result ?? '')
      } catch {
        // JSON 아닌 줄은 무시
      }
    }
  })

  child.stderr.on('data', (data: Buffer) => {
    const text = data.toString()
    process.stderr.write(text)
    errors.push(text)
  })

  child.on('close', async (code) => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`[${timestamp()}] 작업 완료 (${elapsed}s, 종료 코드: ${code})`)
    await cleanup(tempFiles)

    const result = output.join('').trim()
    const errorText = errors.join('').trim()

    if (code !== 0) {
      const errMsg = errorText || `프로세스가 코드 ${code}로 종료되었습니다.`
      await processingMsg.edit(`❌ 오류 발생:\n\`\`\`\n${truncate(errMsg, 1900)}\n\`\`\``)
      return
    }

    if (!result) {
      await processingMsg.edit('✅ 작업 완료 (출력 없음)')
      return
    }

    const chunks = splitIntoChunks(result, 1900)
    await processingMsg.edit(`✅ 작업 완료:\n\`\`\`\n${chunks[0]}\n\`\`\``)

    for (let i = 1; i < chunks.length; i++) {
      await message.reply(`\`\`\`\n${chunks[i]}\n\`\`\``)
    }
  })

  child.on('error', async (err) => {
    await cleanup(tempFiles)
    if (err.message.includes('ENOENT')) {
      await processingMsg.edit(
        '❌ `claude` 명령어를 찾을 수 없습니다.\n' +
        'Claude Code CLI가 설치되어 있는지 확인하세요: https://claude.ai/code'
      )
    } else {
      await processingMsg.edit(`❌ 실행 오류: ${err.message}`)
    }
  })
}

async function cleanup(tempFiles: string[]) {
  await Promise.all(tempFiles.map((f) => unlink(f).catch(() => {})))
}

function logStreamEvent(event: Record<string, unknown>) {
  switch (event.type) {
    case 'assistant': {
      const content = event.message as { content?: Array<{ type: string; text?: string; name?: string; input?: unknown }> }
      for (const block of content?.content ?? []) {
        if (block.type === 'text' && block.text) {
          process.stdout.write(block.text)
        } else if (block.type === 'tool_use') {
          console.log(`\n[도구] ${block.name}`, block.input ?? '')
        }
      }
      break
    }
    case 'tool_result':
      console.log(`[도구 완료]`)
      break
  }
}

function timestamp(): string {
  return new Date().toLocaleTimeString('ko-KR')
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '\n...(잘림)'
}

function splitIntoChunks(str: string, chunkSize: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize))
  }
  return chunks
}

client.login(DISCORD_TOKEN)
