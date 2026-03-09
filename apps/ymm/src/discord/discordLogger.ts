import { stripAnsi, splitIntoChunks } from '../utils/ansi.js'

type SendFn = (content: string) => Promise<unknown>

export function createDiscordLogger(channel: { send: SendFn }) {
  const buffer: string[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  function flush() {
    if (buffer.length === 0) return
    const text = buffer.splice(0).join('\n')
    const chunks = splitIntoChunks(text, 1800)
    for (const chunk of chunks) {
      channel.send('```\n' + chunk + '\n```').catch(() => {})
    }
  }

  function log(text: string) {
    buffer.push(stripAnsi(text))
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null
        flush()
      }, 1500)
    }
  }

  function forceFlush() {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    flush()
  }

  return { log, forceFlush }
}
