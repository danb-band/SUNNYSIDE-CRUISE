import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const DEFAULT_CODEX_HOME = process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex')
const DEFAULT_PROJECT_ROOT = process.env.PROJECT_ROOT ?? process.cwd()
const MAX_SKILL_FILES = 20

type SharedAgentContextOptions = {
  projectRoot?: string
  codexHome?: string
  skillFileLimit?: number
}

function listSkillFiles(root: string, limit: number): string[] {
  if (!fs.existsSync(root)) return []

  const found: string[] = []
  const queue = [root]

  while (queue.length > 0 && found.length < limit) {
    const current = queue.shift()
    if (!current) continue

    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      const nextPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        queue.push(nextPath)
        continue
      }

      if (entry.isFile() && entry.name === 'SKILL.md') {
        found.push(nextPath)
        if (found.length >= limit) break
      }
    }
  }

  return found.sort()
}

function readFileIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null

  try {
    return fs.readFileSync(filePath, 'utf8').trim()
  } catch {
    return null
  }
}

function formatList(title: string, items: string[], total: number) {
  if (items.length === 0) return `${title}\n- 없음\n`

  const lines = [title, ...items.map((item) => `- ${item}`)]
  if (total > items.length) {
    lines.push(`- ... 외 ${total - items.length}개`)
  }

  return lines.join('\n') + '\n'
}

export function buildSharedAgentContextPrompt({
  projectRoot = DEFAULT_PROJECT_ROOT,
  codexHome = DEFAULT_CODEX_HOME,
  skillFileLimit = MAX_SKILL_FILES,
}: SharedAgentContextOptions = {}) {
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md')
  const userSkillsRoot = path.join(codexHome, 'skills')
  const pluginSkillsRoot = path.join(codexHome, 'plugins', 'cache')
  const claudeMd = readFileIfExists(claudeMdPath)
  const userSkillFiles = listSkillFiles(userSkillsRoot, skillFileLimit)
  const pluginSkillFiles = listSkillFiles(pluginSkillsRoot, skillFileLimit)

  const sections = [
    '[SHARED CONTEXT]',
    'Claude와 Codex 모두 아래 로컬 컨텍스트를 사용할 수 있습니다.',
    `- 프로젝트 루트: ${projectRoot}`,
    `- Codex 홈: ${codexHome}`,
    '',
  ]

  if (claudeMd) {
    sections.push(
      `프로젝트 규칙 파일: ${claudeMdPath}`,
      '```md',
      claudeMd,
      '```',
      '',
    )
  } else {
    sections.push(`프로젝트 규칙 파일: ${claudeMdPath} (찾을 수 없음)`, '')
  }

  sections.push(
    formatList('사용자 스킬 파일', userSkillFiles, userSkillFiles.length).trimEnd(),
    '',
    formatList('플러그인 스킬 파일', pluginSkillFiles, pluginSkillFiles.length).trimEnd(),
    '',
    '위 경로의 파일은 필요할 때 직접 읽고, 사용자 요청과 관련된 것만 선택해서 사용하세요.',
    '',
  )

  return sections.join('\n')
}
