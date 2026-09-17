import assert from 'node:assert/strict'
import test from 'node:test'
import { formatToolInput, summarizeToolResult } from '../../src/claude/formatter.js'
import { stripAnsi } from '../../src/utils/ansi.js'

// formatToolInput

test('formatToolInput: Read shows file path', () => {
  const result = formatToolInput('Read', { file_path: '/src/foo.ts' })
  assert.equal(result, '파일: /src/foo.ts')
})

test('formatToolInput: Write shows file path', () => {
  const result = formatToolInput('Write', { file_path: '/src/bar.ts' })
  assert.equal(result, '파일: /src/bar.ts')
})

test('formatToolInput: Edit shows file path and old_string preview', () => {
  const result = formatToolInput('Edit', {
    file_path: '/src/baz.ts',
    old_string: 'const x = 1',
  })
  assert.ok(result.includes('파일: /src/baz.ts'))
  assert.ok(result.includes('const x = 1'))
})

test('formatToolInput: Bash shows command', () => {
  const result = formatToolInput('Bash', { command: 'ls -la' })
  assert.equal(result, '명령: ls -la')
})

test('formatToolInput: Glob shows pattern', () => {
  const result = formatToolInput('Glob', { pattern: '**/*.ts' })
  assert.equal(result, '패턴: **/*.ts')
})

test('formatToolInput: Glob shows pattern and path', () => {
  const result = formatToolInput('Glob', { pattern: '**/*.ts', path: '/src' })
  assert.equal(result, '패턴: **/*.ts (경로: /src)')
})

test('formatToolInput: Grep shows search pattern', () => {
  const result = formatToolInput('Grep', { pattern: 'TODO' })
  assert.equal(result, '검색: "TODO"')
})

test('formatToolInput: unknown tool falls back to JSON', () => {
  const result = formatToolInput('UnknownTool', { key: 'value' })
  assert.ok(result.includes('value'))
})

// summarizeToolResult

test('summarizeToolResult: Read success shows line count', () => {
  const result = stripAnsi(summarizeToolResult('Read', 'line1\nline2\nline3'))
  assert.ok(result.includes('성공'))
  assert.ok(result.includes('3줄'))
})

test('summarizeToolResult: Write/Edit shows 파일 변경 완료', () => {
  assert.ok(stripAnsi(summarizeToolResult('Write', '')).includes('파일 변경 완료'))
  assert.ok(stripAnsi(summarizeToolResult('Edit', '')).includes('파일 변경 완료'))
})

test('summarizeToolResult: Bash shows execution output preview', () => {
  const result = stripAnsi(summarizeToolResult('Bash', 'output here'))
  assert.ok(result.includes('실행 완료'))
  assert.ok(result.includes('output here'))
})

test('summarizeToolResult: Glob/Grep shows result count', () => {
  const result = stripAnsi(summarizeToolResult('Glob', 'file1.ts\nfile2.ts'))
  assert.ok(result.includes('2개 결과'))
})

test('summarizeToolResult: error content shows 실패', () => {
  const result = stripAnsi(summarizeToolResult('Read', '{"type":"error","message":"not found"}'))
  assert.ok(result.includes('실패'))
})
