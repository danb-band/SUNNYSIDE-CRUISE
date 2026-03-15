import { c } from '../utils/ansi.js'

export function formatToolInput(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case 'Read':   return `파일: ${input.file_path}`
    case 'Write':  return `파일: ${input.file_path}`
    case 'Edit':   return `파일: ${input.file_path}\n  변경 전: ${String(input.old_string ?? '').slice(0, 80).replace(/\n/g, '↵')}${String(input.old_string ?? '').length > 80 ? '...' : ''}`
    case 'Bash':   return `명령: ${String(input.command ?? '').slice(0, 120)}`
    case 'Glob':   return `패턴: ${input.pattern}${input.path ? ` (경로: ${input.path})` : ''}`
    case 'Grep':   return `검색: "${input.pattern}"${input.path ? ` in ${input.path}` : ''}`
    default:       return JSON.stringify(input).slice(0, 200)
  }
}

export function summarizeToolResult(toolName: string, content: unknown): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content)
  if (str.includes('"type":"error"') || str.toLowerCase().includes('error:')) {
    return `${c.red}실패${c.reset} — ${str.slice(0, 120)}`
  }
  switch (toolName) {
    case 'Read': {
      const lines = str.split('\n').length
      return `${c.green}성공${c.reset} (${lines}줄 읽음)`
    }
    case 'Edit':
    case 'Write':
      return `${c.green}파일 변경 완료${c.reset}`
    case 'Bash': {
      const preview = str.slice(0, 120).replace(/\n/g, ' ')
      return `${c.green}실행 완료${c.reset} — 출력: ${preview}${str.length > 120 ? '...' : ''}`
    }
    case 'Glob':
    case 'Grep': {
      const count = str.split('\n').filter(Boolean).length
      return `${c.green}${count}개 결과${c.reset}`
    }
    default:
      return `${c.green}완료${c.reset} (${str.length}자)`
  }
}
