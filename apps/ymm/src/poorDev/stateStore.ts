export type PoorDevPhase =
  | { phase: 'idle' }
  | { phase: 'designing'; originalPrompt: string }
  | { phase: 'coding'; issueNumber: number; branchName: string; designDoc: string; workLog: string[] }

const store = new Map<string, PoorDevPhase>()

export function getPhase(channelId: string): PoorDevPhase {
  return store.get(channelId) ?? { phase: 'idle' }
}

export function setPhase(channelId: string, phase: PoorDevPhase): void {
  store.set(channelId, phase)
}

export function clearPhase(channelId: string): void {
  store.delete(channelId)
}
