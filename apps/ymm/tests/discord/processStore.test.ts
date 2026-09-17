import assert from 'node:assert/strict'
import type { ChildProcess } from 'node:child_process'
import test from 'node:test'
import { clearProcess, getProcess, killProcess, setProcess } from '../../src/discord/processStore.js'

function makeStub(): ChildProcess {
  return { kill: () => {} } as unknown as ChildProcess
}

test('getProcess returns undefined for unknown channelId', () => {
  assert.equal(getProcess('unknown-ch-proc'), undefined)
})

test('setProcess and getProcess round-trip', () => {
  const stub = makeStub()
  setProcess('ch-proc-1', stub)
  assert.strictEqual(getProcess('ch-proc-1'), stub)
})

test('clearProcess removes the process', () => {
  setProcess('ch-proc-2', makeStub())
  clearProcess('ch-proc-2')
  assert.equal(getProcess('ch-proc-2'), undefined)
})

test('killProcess returns true and removes process when it exists', () => {
  let killed = false
  const stub = { kill: () => { killed = true } } as unknown as ChildProcess
  setProcess('ch-proc-3', stub)

  const result = killProcess('ch-proc-3')

  assert.equal(result, true)
  assert.equal(killed, true)
  assert.equal(getProcess('ch-proc-3'), undefined)
})

test('killProcess returns false when process does not exist', () => {
  const result = killProcess('ch-proc-nonexistent')
  assert.equal(result, false)
})
