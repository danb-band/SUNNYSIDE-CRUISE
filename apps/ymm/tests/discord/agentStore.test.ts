import assert from 'node:assert/strict'
import test from 'node:test'
import { getAgent, setAgent } from '../../src/discord/agentStore.js'

test('getAgent returns "claude" as default for unknown channelId', () => {
  assert.equal(getAgent('unknown-ch-agent'), 'claude')
})

test('setAgent and getAgent round-trip for codex', () => {
  setAgent('ch-agent-1', 'codex')
  assert.equal(getAgent('ch-agent-1'), 'codex')
})

test('setAgent and getAgent round-trip for poor-dev', () => {
  setAgent('ch-agent-2', 'poor-dev')
  assert.equal(getAgent('ch-agent-2'), 'poor-dev')
})

test('setAgent overwrites previous value', () => {
  setAgent('ch-agent-3', 'codex')
  setAgent('ch-agent-3', 'claude')
  assert.equal(getAgent('ch-agent-3'), 'claude')
})
