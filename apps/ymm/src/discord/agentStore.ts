export type AgentType = 'claude' | 'codex'

const channelAgents = new Map<string, AgentType>()

export function getAgent(channelId: string): AgentType {
  return channelAgents.get(channelId) ?? 'claude'
}

export function setAgent(channelId: string, agent: AgentType) {
  channelAgents.set(channelId, agent)
}
