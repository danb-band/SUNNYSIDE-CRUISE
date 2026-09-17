import assert from 'node:assert/strict'
import test from 'node:test'
import { clearSession, getSession, setSession } from '../../src/discord/sessionStore.js'

test('getSession returns undefined for unknown channelId', () => {
  assert.equal(getSession('unknown-ch-sess'), undefined)
})

test('setSession and getSession round-trip', () => {
  setSession('ch-sess-1', 'session-abc')
  assert.equal(getSession('ch-sess-1'), 'session-abc')
})

test('clearSession removes the session', () => {
  setSession('ch-sess-2', 'session-xyz')
  clearSession('ch-sess-2')
  assert.equal(getSession('ch-sess-2'), undefined)
})

test('clearSession on unknown channelId is a no-op', () => {
  clearSession('nonexistent-sess-ch')
  assert.equal(getSession('nonexistent-sess-ch'), undefined)
})

test('setSession overwrites previous sessionId', () => {
  setSession('ch-sess-3', 'session-old')
  setSession('ch-sess-3', 'session-new')
  assert.equal(getSession('ch-sess-3'), 'session-new')
})
