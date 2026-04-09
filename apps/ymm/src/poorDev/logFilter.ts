function codeCharRatio(text: string): number {
  const meaningful = text.replace(/\s/g, '')
  if (!meaningful) return 0
  const codeLike = (meaningful.match(/[{}()[\];=<>`$\\]/g) ?? []).length
  return codeLike / meaningful.length
}

let inCodeBlock = false
let previousBlank = false

export function resetCodingLogFilterState(): void {
  inCodeBlock = false
  previousBlank = false
}

function hasSummaryKeyword(line: string): boolean {
  return /(완료|수정|추가|제거|리팩터|테스트|빌드|검증|적용|updated|fixed|added|removed|refactor|test|build|implement|changed|created)/i.test(line)
}

function hasErrorKeyword(line: string): boolean {
  return /(error|fail|failed|warning|exception|traceback|ENOENT|EACCES|EPERM|fatal)/i.test(line)
}

function isDiffMarker(line: string): boolean {
  return /^(diff\s+--git|index\s+[a-f0-9]+|@@\s|@@$|\+\+\+\s|---\s)/.test(line)
}

function isDiffContent(line: string): boolean {
  if (/^\+/.test(line)) return true
  if (!/^-/.test(line)) return false

  // markdown bullet summary는 허용하고, 코드/패치 라인만 차단
  if (/^-\s+[\p{L}\p{N}]/u.test(line) && codeCharRatio(line) < 0.2) return false
  return true
}

function isCodeLikeSentence(line: string): boolean {
  return /(^|\s)(const|let|var|function|class|interface|type|import|export|return|if|for|while|switch|try|catch)\b/.test(line)
}

function isCodeSnippet(line: string): boolean {
  if (isCodeLikeSentence(line)) return true
  if (/=>/.test(line)) return true
  if (/^[a-zA-Z_$][\w$]*\s*\(.*\)\s*\{?$/.test(line)) return true
  if (/[{}()[\];]/.test(line) && /[=:]/.test(line)) return true
  if (/^<\/?[A-Za-z][^>]*>$/.test(line)) return true
  return false
}

export function filterCodingLine(line: string): { emit: boolean; text: string } {
  const text = line.trim()

  if (!text) {
    if (previousBlank) return { emit: false, text: '' }
    previousBlank = true
    return { emit: false, text: '' }
  }
  previousBlank = false

  if (/^```/.test(text)) {
    inCodeBlock = !inCodeBlock
    return { emit: false, text: '' }
  }
  if (inCodeBlock) return { emit: false, text: '' }
  if (isDiffMarker(text)) return { emit: false, text }
  if (isDiffContent(text)) return { emit: false, text }
  if (isCodeSnippet(text)) return { emit: false, text }

  const ratio = codeCharRatio(text)

  // 에러/경고는 우선 전달하되, 너무 코드스러운 긴 라인은 차단
  if (hasErrorKeyword(text)) {
    if (text.length > 80 && ratio > 0.4) return { emit: false, text }
    return { emit: true, text: text.slice(0, 200) }
  }

  if (text.length > 80 && isCodeLikeSentence(text) && ratio > 0.2) return { emit: false, text }
  if (text.length > 80 && ratio > 0.4) return { emit: false, text }

  if (text.length <= 60) return { emit: true, text }
  if (hasSummaryKeyword(text) && ratio < 0.3) return { emit: true, text: text.slice(0, 200) }

  if (text.length <= 200 && ratio < 0.3) return { emit: true, text }

  return { emit: false, text }
}
