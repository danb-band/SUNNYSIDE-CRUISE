import assert from 'node:assert/strict'
import test from 'node:test'
import { clearPhase, getPhase, setPhase } from '../../src/poorDev/stateStore.js'

test('getPhase returns idle for unknown channelId', () => {
  assert.deepEqual(getPhase('unknown-ch'), { phase: 'idle' })
})

test('setPhase and getPhase round-trip for designing phase', () => {
  setPhase('ch-state-1', { phase: 'designing', originalPrompt: 'do something' })
  assert.deepEqual(getPhase('ch-state-1'), {
    phase: 'designing',
    originalPrompt: 'do something',
  })
})

test('setPhase and getPhase round-trip for coding phase', () => {
  const phase = {
    phase: 'coding' as const,
    issueNumber: 42,
    branchName: 'feature/42-test',
    designDoc: 'design doc content',
    workLog: ['step 1'],
  }
  setPhase('ch-state-2', phase)
  assert.deepEqual(getPhase('ch-state-2'), phase)
})

test('clearPhase removes the phase (returns idle)', () => {
  setPhase('ch-state-3', { phase: 'designing', originalPrompt: 'test' })
  clearPhase('ch-state-3')
  assert.deepEqual(getPhase('ch-state-3'), { phase: 'idle' })
})

test('clearPhase on unknown channelId is a no-op', () => {
  clearPhase('nonexistent-ch')
  assert.deepEqual(getPhase('nonexistent-ch'), { phase: 'idle' })
})
