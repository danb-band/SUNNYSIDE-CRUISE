import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN
export const PROJECT_ROOT =
  process.env.PROJECT_ROOT ?? path.resolve(__dirname, '../../..')
export const ALLOWED_CHANNEL_IDS = process.env.ALLOWED_CHANNEL_IDS
  ? process.env.ALLOWED_CHANNEL_IDS.split(',').map((id) => id.trim())
  : []

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN이 설정되지 않았습니다. .env 파일을 확인하세요.')
  process.exit(1)
}
