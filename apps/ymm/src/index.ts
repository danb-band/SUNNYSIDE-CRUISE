import fs from 'fs'
import os from 'os'
import path from 'path'
import './config.js'
import { startBot } from './discord/bot.js'

const PID_FILE = path.join(os.tmpdir(), 'ymm-bot.pid')

if (fs.existsSync(PID_FILE)) {
  const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10)
  try {
    process.kill(oldPid, 0)
    console.error(`이미 실행 중인 인스턴스가 있습니다 (PID: ${oldPid}). 종료합니다.`)
    process.exit(1)
  } catch {
    fs.unlinkSync(PID_FILE)
  }
}

fs.writeFileSync(PID_FILE, String(process.pid))

const cleanup = () => { try { fs.unlinkSync(PID_FILE) } catch {} }
process.on('exit', cleanup)
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

startBot()
