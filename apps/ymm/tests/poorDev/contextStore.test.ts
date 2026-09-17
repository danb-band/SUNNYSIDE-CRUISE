import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

// config.ts reads PROJECT_ROOT and DISCORD_TOKEN at module load time.
// Set env vars before dynamic import so CONTEXT_PATH points to a temp dir.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ymm-ctx-test-'))
process.env.DISCORD_TOKEN = 'test-token'
process.env.PROJECT_ROOT = tmpDir

const { saveContext, loadContext, clearContext } = await import(
  '../../src/poorDev/contextStore.js'
)

const base = {
  channelId: 'ch-1',
  originalPrompt: 'test prompt',
  designDoc: 'design document',
  issueNumber: 42,
  branchName: 'feature/42-test',
  startedAt: '2026-01-01T00:00:00Z',
}

test('saveContext and loadContext round-trip', () => {
  saveContext(base)
  const loaded = loadContext()
  assert.ok(loaded)
  assert.equal(loaded.channelId, base.channelId)
  assert.equal(loaded.originalPrompt, base.originalPrompt)
  assert.equal(loaded.issueNumber, base.issueNumber)
  assert.equal(loaded.branchName, base.branchName)
  assert.equal(loaded.startedAt, base.startedAt)
  clearContext()
})

test('loadContext returns null when no context file exists', () => {
  clearContext()
  assert.equal(loadContext(), null)
})

test('clearContext removes context for matching channelId', () => {
  saveContext(base)
  clearContext('ch-1')
  assert.equal(loadContext(), null)
})

test('clearContext does not remove context for different channelId', () => {
  saveContext(base)
  clearContext('ch-999')
  assert.ok(loadContext())
  clearContext()
})

test('saveContext truncates oversized designDoc to 60000 chars', () => {
  const longDoc = 'x'.repeat(70000)
  saveContext({ ...base, designDoc: longDoc })
  const loaded = loadContext()
  assert.ok(loaded)
  assert.ok(loaded.designDoc.length <= 60000)
  clearContext()
})

test('saveContext preserves optional designSessionId', () => {
  saveContext({ ...base, designSessionId: 'sess-abc' })
  const loaded = loadContext()
  assert.ok(loaded)
  assert.equal(loaded.designSessionId, 'sess-abc')
  clearContext()
})

// Cleanup temp dir after all tests
process.on('exit', () => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})
