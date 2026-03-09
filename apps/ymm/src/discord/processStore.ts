import type { ChildProcess } from 'child_process'

/** 채널별 실행 중인 Claude 프로세스를 관리합니다. */
const processes = new Map<string, ChildProcess>() // channelId -> ChildProcess

export function setProcess(channelId: string, child: ChildProcess) {
  processes.set(channelId, child)
}

export function getProcess(channelId: string): ChildProcess | undefined {
  return processes.get(channelId)
}

export function clearProcess(channelId: string) {
  processes.delete(channelId)
}

/** 프로세스를 종료하고 스토어에서 제거합니다. true 반환 시 종료 성공. */
export function killProcess(channelId: string): boolean {
  const child = processes.get(channelId)
  if (!child) return false
  try {
    child.kill('SIGTERM')
  } catch {}
  processes.delete(channelId)
  return true
}
