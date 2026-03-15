import { Message } from 'discord.js'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function downloadAttachments(message: Message, tempFiles: string[]): Promise<string[]> {
  const paths: string[] = []
  for (const attachment of message.attachments.values()) {
    const ext = path.extname(attachment.name ?? '') || ''
    const tmpPath = path.join(os.tmpdir(), `discord-${attachment.id}${ext}`)
    const res = await fetch(attachment.url)
    const buffer = Buffer.from(await res.arrayBuffer())
    await writeFile(tmpPath, buffer)
    tempFiles.push(tmpPath)
    paths.push(tmpPath)
  }
  return paths
}

export function buildPrompt(text: string, attachmentPaths: string[]): string {
  if (attachmentPaths.length === 0) return text
  const fileList = attachmentPaths.map((p) => `- ${p}`).join('\n')
  if (text) return `${text}\n\n첨부파일:\n${fileList}`
  return `다음 첨부파일을 참고해줘:\n${fileList}`
}

export async function cleanup(tempFiles: string[]) {
  await Promise.all(tempFiles.map((f) => unlink(f).catch(() => {})))
}
