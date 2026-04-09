function section(doc: string, title: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^##\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=^##\\s|$)`, 'im')
  return (doc.match(re)?.[1] ?? '').trim()
}

export function buildPRBody(params: {
  issueNumber: number
  designDoc: string
  workLog: string[]
}): string {
  const workItems = params.workLog
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => `- ${line.slice(0, 200)}`)

  const goal = section(params.designDoc, '목표')
  const done = section(params.designDoc, '완료 조건') || section(params.designDoc, '완료조건')

  const blocks = [
    `closes #${params.issueNumber}`,
    '',
    '## 작업 내용',
    ...(workItems.length > 0 ? workItems : ['- (로그 기반 요약 없음)']),
    '',
    '## 설계 기반',
  ]

  if (goal) {
    blocks.push('### 목표', goal)
  }
  if (done) {
    blocks.push('### 완료 조건', done)
  }
  if (!goal && !done) {
    blocks.push(params.designDoc.slice(0, 2000))
  }

  return blocks.join('\n').trim()
}
