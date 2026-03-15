import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN
export const PROJECT_ROOT =
  process.env.PROJECT_ROOT ?? path.resolve(__dirname, '../../..')

// 채널별 ID
export const DISCORD_COMMAND_ID = process.env.DISCORD_COMMAND_ID ?? ''  // 명령/질의응답 채널
export const DISCORD_RESULT_ID  = process.env.DISCORD_RESULT_ID  ?? ''  // 작업 완료 / PR 결과 채널
export const DISCORD_LOG_ID     = process.env.DISCORD_LOG_ID     ?? ''  // 모든 로그 채널

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN
export const GITHUB_REPO = process.env.GITHUB_REPO

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN이 설정되지 않았습니다. .env 파일을 확인하세요.')
  process.exit(1)
}
if (!DISCORD_COMMAND_ID || !DISCORD_RESULT_ID || !DISCORD_LOG_ID) {
  console.warn('⚠️  DISCORD_COMMAND_ID / DISCORD_RESULT_ID / DISCORD_LOG_ID 중 하나 이상이 설정되지 않았습니다.')
}
