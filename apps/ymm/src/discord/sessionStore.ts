/** 채널별 활성 Claude 세션을 관리합니다. */
const sessions = new Map<string, string>() // channelId -> sessionId

export function getSession(channelId: string): string | undefined {
  return sessions.get(channelId)
}

export function setSession(channelId: string, sessionId: string) {
  sessions.set(channelId, sessionId)
}

export function clearSession(channelId: string) {
  sessions.delete(channelId)
}
