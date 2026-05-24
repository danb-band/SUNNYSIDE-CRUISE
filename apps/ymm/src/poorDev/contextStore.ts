import fs from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from '../config.js'

const MAX_DESIGN_DOC_LENGTH = 60000
const CONTEXT_FILE = '.poor-dev-context.json'
const CONTEXT_PATH = path.join(PROJECT_ROOT, CONTEXT_FILE)

export type PoorDevContext = {
  channelId: string
  originalPrompt: string
  designDoc: string
  issueNumber: number
  branchName: string
  designSessionId?: string
  startedAt: string
}

export function saveContext(context: PoorDevContext): void {
  try {
    const safeContext: PoorDevContext = {
      ...context,
      designDoc: context.designDoc.slice(0, MAX_DESIGN_DOC_LENGTH),
    }
    fs.writeFileSync(CONTEXT_PATH, JSON.stringify(safeContext, null, 2), 'utf8')
  } catch {
    // 런타임 컨텍스트 저장 실패는 전체 파이프라인 실패로 취급하지 않는다.
  }
}

export function loadContext(): PoorDevContext | null {
  if (!fs.existsSync(CONTEXT_PATH)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(CONTEXT_PATH, 'utf8')) as Partial<PoorDevContext>
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.channelId !== 'string') return null
    if (typeof parsed.originalPrompt !== 'string') return null
    if (typeof parsed.designDoc !== 'string') return null
    if (typeof parsed.issueNumber !== 'number') return null
    if (typeof parsed.branchName !== 'string') return null
    if (typeof parsed.startedAt !== 'string') return null
    return {
      channelId: parsed.channelId,
      originalPrompt: parsed.originalPrompt,
      designDoc: parsed.designDoc.slice(0, MAX_DESIGN_DOC_LENGTH),
      issueNumber: parsed.issueNumber,
      branchName: parsed.branchName,
      designSessionId: typeof parsed.designSessionId === 'string' ? parsed.designSessionId : undefined,
      startedAt: parsed.startedAt,
    }
  } catch {
    return null
  }
}

export function clearContext(channelId?: string): void {
  if (!fs.existsSync(CONTEXT_PATH)) return
  try {
    if (channelId) {
      const existing = loadContext()
      if (existing && existing.channelId !== channelId) return
    }
    fs.unlinkSync(CONTEXT_PATH)
  } catch {
    // 컨텍스트 정리 실패는 호출자 흐름을 중단하지 않는다.
  }
}
