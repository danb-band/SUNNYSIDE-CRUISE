import assert from 'node:assert/strict'
import test from 'node:test'
import { filterCodingLine, resetCodingLogFilterState } from '../../src/poorDev/logFilter.js'

test('filterCodingLine emits short plain text', () => {
  resetCodingLogFilterState()
  const result = filterCodingLine('작업 완료')
  assert.equal(result.emit, true)
})

test('filterCodingLine suppresses code snippet (const declaration)', () => {
  resetCodingLogFilterState()
  const result = filterCodingLine('const x = foo()')
  assert.equal(result.emit, false)
})

test('filterCodingLine suppresses lines inside code block', () => {
  resetCodingLogFilterState()
  filterCodingLine('```') // opens code block
  const result = filterCodingLine('plain text inside block')
  assert.equal(result.emit, false)
})

test('filterCodingLine closes code block on second backtick fence', () => {
  resetCodingLogFilterState()
  filterCodingLine('```') // opens
  filterCodingLine('```') // closes
  const result = filterCodingLine('작업 완료')
  assert.equal(result.emit, true)
})

test('resetCodingLogFilterState clears code block state', () => {
  resetCodingLogFilterState()
  filterCodingLine('```') // opens code block
  resetCodingLogFilterState()
  // After reset, normal lines should be evaluated as usual again
  const result = filterCodingLine('작업 완료')
  assert.equal(result.emit, true)
})

test('filterCodingLine emits error keyword lines', () => {
  resetCodingLogFilterState()
  const result = filterCodingLine('error: file not found')
  assert.equal(result.emit, true)
})

test('filterCodingLine emits summary keyword line', () => {
  resetCodingLogFilterState()
  const result = filterCodingLine('파일 수정 완료되었습니다')
  assert.equal(result.emit, true)
})

test('filterCodingLine suppresses diff markers', () => {
  resetCodingLogFilterState()
  const result = filterCodingLine('diff --git a/foo b/foo')
  assert.equal(result.emit, false)
})

test('filterCodingLine suppresses diff content (+/- lines)', () => {
  resetCodingLogFilterState()
  const added = filterCodingLine('+const x = 1')
  assert.equal(added.emit, false)
})
