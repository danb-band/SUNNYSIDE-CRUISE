import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildSharedAgentContextPrompt } from '../src/sharedAgentContext.js'

test('buildSharedAgentContextPrompt includes project rules and skill paths', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ymm-agent-context-'))
  const projectRoot = path.join(sandboxRoot, 'project')
  const codexHome = path.join(sandboxRoot, 'codex-home')

  fs.mkdirSync(projectRoot, { recursive: true })
  fs.mkdirSync(path.join(codexHome, 'skills', 'custom'), { recursive: true })
  fs.mkdirSync(path.join(codexHome, 'plugins', 'cache', 'plugin-a', 'skills'), {
    recursive: true,
  })

  fs.writeFileSync(path.join(projectRoot, 'CLAUDE.md'), '# Rules\n- sync first\n')
  fs.writeFileSync(
    path.join(codexHome, 'skills', 'custom', 'SKILL.md'),
    '# Local skill\n',
  )
  fs.writeFileSync(
    path.join(codexHome, 'plugins', 'cache', 'plugin-a', 'skills', 'SKILL.md'),
    '# Plugin skill\n',
  )

  const prompt = buildSharedAgentContextPrompt({ projectRoot, codexHome })

  assert.match(prompt, new RegExp(`프로젝트 루트: ${escapeRegex(projectRoot)}`))
  assert.match(prompt, /# Rules\n- sync first/)
  assert.match(
    prompt,
    new RegExp(
      `- ${escapeRegex(path.join(codexHome, 'skills', 'custom', 'SKILL.md'))}`,
    ),
  )
  assert.match(
    prompt,
    new RegExp(
      `- ${escapeRegex(
        path.join(codexHome, 'plugins', 'cache', 'plugin-a', 'skills', 'SKILL.md'),
      )}`,
    ),
  )

  fs.rmSync(sandboxRoot, { recursive: true, force: true })
})

test('buildSharedAgentContextPrompt reports missing CLAUDE.md', () => {
  const sandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ymm-agent-context-missing-'))
  const projectRoot = path.join(sandboxRoot, 'project')
  const codexHome = path.join(sandboxRoot, 'codex-home')

  fs.mkdirSync(projectRoot, { recursive: true })
  fs.mkdirSync(codexHome, { recursive: true })

  const prompt = buildSharedAgentContextPrompt({ projectRoot, codexHome })

  assert.match(prompt, /프로젝트 규칙 파일: .* \(찾을 수 없음\)/)
  assert.match(prompt, /사용자 스킬 파일\n- 없음/)
  assert.match(prompt, /플러그인 스킬 파일\n- 없음/)

  fs.rmSync(sandboxRoot, { recursive: true, force: true })
})

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
