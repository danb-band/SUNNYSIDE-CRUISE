import assert from 'node:assert/strict'
import test from 'node:test'
import { splitIntoChunks, stripAnsi, truncate } from '../../src/utils/ansi.js'

test('stripAnsi removes ANSI escape codes', () => {
  assert.equal(stripAnsi('\x1b[32mhello\x1b[0m'), 'hello')
  assert.equal(stripAnsi('\x1b[1m\x1b[90mtext\x1b[0m'), 'text')
})

test('stripAnsi passes through plain text unchanged', () => {
  assert.equal(stripAnsi('plain text'), 'plain text')
  assert.equal(stripAnsi(''), '')
})

test('truncate returns original string when within limit', () => {
  assert.equal(truncate('hello', 10), 'hello')
  assert.equal(truncate('hello', 5), 'hello')
})

test('truncate truncates and appends marker when over limit', () => {
  const result = truncate('hello world', 5)
  assert.equal(result, 'hello\n...(잘림)')
})

test('splitIntoChunks splits string into chunks of given size', () => {
  assert.deepEqual(splitIntoChunks('abcdef', 2), ['ab', 'cd', 'ef'])
  assert.deepEqual(splitIntoChunks('abcde', 2), ['ab', 'cd', 'e'])
})

test('splitIntoChunks returns empty array for empty string', () => {
  assert.deepEqual(splitIntoChunks('', 5), [])
})
