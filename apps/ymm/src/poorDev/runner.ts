import { ChildProcess, execFileSync, execSync } from 'child_process'
import { Message, TextChannel } from 'discord.js'
import { GITHUB_REPO, GITHUB_TOKEN, PROJECT_ROOT } from '../config.js'
import { cleanup } from '../discord/attachments.js'
import { createIssue, createPR } from '../github/client.js'
import { buildPRBody } from './prSummary.js'
import { getPhase, setPhase } from './stateStore.js'
import { runPoorDevDesign } from './designPhase.js'
import { runPoorDevCoding } from './codingPhase.js'
import { clearContext, loadContext, saveContext } from './contextStore.js'

type Channels = {
  logChannel?: TextChannel
  resultChannel?: TextChannel
  commandChannel?: TextChannel
}

type RunPoorDevOptions = {
  tempFiles?: string[]
  onProcessSwitch?: (child: ChildProcess) => void
  onDone?: () => void
}

function sanitizeTitle(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 70) || 'poor-dev task'
}

function extractSection(doc: string, title: string): string {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^##\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=^##\\s|$)`, 'im')
  return (doc.match(re)?.[1] ?? '').trim()
}

function extractIssueTitle(doc: string, prompt: string): string {
  const fromDoc = extractSection(doc, 'ISSUE_TITLE').split('\n')[0]?.trim() ?? ''
  return sanitizeTitle(fromDoc || prompt)
}

function extractIssueLabel(doc: string): 'enhancement' | 'task' {
  const label = extractSection(doc, 'ISSUE_LABEL').split('\n')[0]?.trim().toLowerCase()
  return label === 'enhancement' ? 'enhancement' : 'task'
}

function checkoutFeatureBranch(issueNumber: number): string {
  const branchName = `feat/${issueNumber}-poor-dev`
  execSync(`git -C "${PROJECT_ROOT}" checkout dev`, { stdio: 'pipe' })
  execSync(`git -C "${PROJECT_ROOT}" pull origin dev`, { stdio: 'pipe' })
  try {
    execSync(`git -C "${PROJECT_ROOT}" checkout -b ${branchName}`, { stdio: 'pipe' })
  } catch {
    execSync(`git -C "${PROJECT_ROOT}" checkout ${branchName}`, { stdio: 'pipe' })
  }
  return branchName
}

function pushBranch(branchName: string): void {
  execSync(`git -C "${PROJECT_ROOT}" push -u origin ${branchName}`, { stdio: 'pipe' })
}

function buildIssueBodyFromDesign(designDocRaw: string): string {
  const trimmed = designDocRaw.trim()
  if (trimmed.length <= 60000) return trimmed
  return `${trimmed.slice(0, 60000)}\n\n(자동 잘림: designDoc 길이가 너무 길어 60,000자로 제한됨)`
}

function commitPendingChanges(issueNumber: number, logChannel?: TextChannel): void {
  try {
    const status = execFileSync('git', ['-C', PROJECT_ROOT, 'status', '--porcelain'], { encoding: 'utf8' }).trim()
    if (!status) return

    execFileSync('git', ['-C', PROJECT_ROOT, 'add', '-A'], { stdio: 'pipe' })

    const staged = execFileSync('git', ['-C', PROJECT_ROOT, 'diff', '--cached', '--name-only'], { encoding: 'utf8' }).trim()
    if (!staged) return

    const commitMessage = `feat(poor-dev): implement issue #${issueNumber}\n\ncloses #${issueNumber}`
    execFileSync('git', ['-C', PROJECT_ROOT, 'commit', '-m', commitMessage], { stdio: 'pipe' })
    logChannel?.send('✅ [poor-dev] 미커밋 변경사항을 자동 커밋했습니다.').catch(() => {})
  } catch (err) {
    logChannel?.send(`⚠️ [poor-dev] 자동 커밋 실패(계속 진행): ${(err as Error).message}`).catch(() => {})
  }
}

export async function runPoorDev(
  prompt: string,
  message: Message,
  channels: Channels,
  options: RunPoorDevOptions = {},
): Promise<ChildProcess | null> {
  const target = channels.resultChannel ?? (message.channel as TextChannel)

  if (!GITHUB_REPO || !GITHUB_TOKEN) {
    await target.send('❌ poor-dev 모드는 GITHUB_REPO와 GITHUB_TOKEN 설정이 필요합니다.')
    return null
  }

  const channelId = message.channelId
  const existingContext = loadContext()
  if (existingContext) {
    channels.logChannel?.send(`⚠️ [poor-dev] 이전 컨텍스트 발견, 새 실행으로 덮어씁니다. (branch: ${existingContext.branchName})`).catch(() => {})
  }
  setPhase(channelId, { phase: 'designing', originalPrompt: prompt })

  const processingMsg = await message.reply('🧠 poor-dev 설계 단계 시작 (Claude stream-json)...')
  channels.logChannel?.send('🚀 [poor-dev] 설계 단계 시작').catch(() => {})

  const designChild = runPoorDevDesign(prompt, message, processingMsg, {
    logChannel: channels.logChannel ? { send: (content: string) => channels.logChannel!.send(content) } : undefined,
    onDone: async () => {
      // design 단계 종료만으로는 전체 파이프라인 종료가 아님
    },
    onError: async () => {
      clearContext(channelId)
      setPhase(channelId, { phase: 'idle' })
      options.onDone?.()
      if (options.tempFiles) await cleanup(options.tempFiles)
    },
    onDesignComplete: async (designDocRaw: string, designSessionId?: string) => {
      const designDocForPR = designDocRaw.trim()
      const designDocForCoding = designDocForPR.slice(0, 4000)
      const issueTitle = extractIssueTitle(designDocRaw, prompt)
      const issueLabel = extractIssueLabel(designDocRaw)
      let issueNumber = 0
      let branchName = ''
      const startedAt = new Date().toISOString()
      const workLog: string[] = []

      try {
        channels.logChannel?.send('📌 [poor-dev] GitHub 이슈 생성 중...').catch(() => {})
        issueNumber = await createIssue(issueTitle, buildIssueBodyFromDesign(designDocRaw), [issueLabel])

        channels.logChannel?.send('🌿 [poor-dev] feature 브랜치 준비 중...').catch(() => {})
        branchName = checkoutFeatureBranch(issueNumber)

        saveContext({
          channelId,
          originalPrompt: prompt,
          designDoc: designDocForPR,
          issueNumber,
          branchName,
          designSessionId,
          startedAt,
        })

        setPhase(channelId, {
          phase: 'coding',
          issueNumber,
          branchName,
          designDoc: designDocForPR,
          workLog,
          designSessionId,
        })

        await processingMsg.edit(`🧠 poor-dev 코딩 단계 시작: \`${branchName}\` (Issue #${issueNumber})`).catch(() => {})

        const codingChild = runPoorDevCoding(issueNumber, designDocForCoding, prompt, processingMsg, {
          logChannel: channels.logChannel ? { send: (content: string) => channels.logChannel!.send(content) } : undefined,
          sessionId: designSessionId,
          onSessionId: (id) => {
            const current = getPhase(channelId)
            if (current.phase !== 'coding') return
            setPhase(channelId, { ...current, designSessionId: id })
            saveContext({
              channelId,
              originalPrompt: prompt,
              designDoc: designDocForPR,
              issueNumber,
              branchName,
              designSessionId: id,
              startedAt,
            })
          },
          onDone: () => {},
          onWorkLogEntry: (line: string) => {
            const current = getPhase(channelId)
            if (current.phase !== 'coding') return
            const normalized = line.trim().slice(0, 200)
            if (!normalized) return
            if (current.workLog[current.workLog.length - 1] === normalized) return
            if (current.workLog.length >= 20) return
            const nextWorkLog = [...current.workLog, normalized]
            setPhase(channelId, {
              ...current,
              workLog: nextWorkLog,
            })
            saveContext({
              channelId,
              originalPrompt: prompt,
              designDoc: designDocForPR,
              issueNumber,
              branchName,
              designSessionId: current.designSessionId,
              startedAt,
            })
          },
          onError: async () => {
            clearContext(channelId)
            setPhase(channelId, { phase: 'idle' })
            options.onDone?.()
            if (options.tempFiles) await cleanup(options.tempFiles)
          },
          onClose: async (code) => {
            const current = getPhase(channelId)
            const finalWorkLog = current.phase === 'coding' ? current.workLog : workLog

            // !stop 등 외부 중단으로 phase가 이미 초기화된 경우 후속 처리 생략
            if (current.phase !== 'coding') {
              options.onDone?.()
              if (options.tempFiles) await cleanup(options.tempFiles)
              return
            }

            if (code !== 0) {
              await target.send(`❌ poor-dev 코딩 실패 (code=${code ?? 'null'}). 브랜치: \`${branchName}\``)
              clearContext(channelId)
              setPhase(channelId, { phase: 'idle' })
              options.onDone?.()
              if (options.tempFiles) await cleanup(options.tempFiles)
              return
            }

            try {
              commitPendingChanges(issueNumber, channels.logChannel)
              channels.logChannel?.send('⬆️ [poor-dev] 브랜치 push 중...').catch(() => {})
              pushBranch(branchName)
            } catch (err) {
              await target.send(`❌ 브랜치 push 실패: ${(err as Error).message}\n브랜치: \`${branchName}\``)
              clearContext(channelId)
              setPhase(channelId, { phase: 'idle' })
              options.onDone?.()
              if (options.tempFiles) await cleanup(options.tempFiles)
              return
            }

            try {
              const prBody = buildPRBody({
                issueNumber,
                designDoc: designDocForPR,
                workLog: finalWorkLog,
              })
              const pr = await createPR(
                {
                  number: issueNumber,
                  title: issueTitle,
                  body: designDocForPR,
                  labels: [issueLabel],
                  state: 'open',
                  url: `https://github.com/${GITHUB_REPO}/issues/${issueNumber}`,
                },
                branchName,
                'dev',
                prBody,
                issueTitle,
              )
              await target.send(`🎉 poor-dev PR 생성 완료: ${pr.url}`)
            } catch (err) {
              await target.send(`❌ PR 생성 실패: ${(err as Error).message}\n브랜치: \`${branchName}\``)
            } finally {
              clearContext(channelId)
              setPhase(channelId, { phase: 'idle' })
              options.onDone?.()
              if (options.tempFiles) await cleanup(options.tempFiles)
            }
          },
        })

        options.onProcessSwitch?.(codingChild)
      } catch (err) {
        await processingMsg.edit(`❌ poor-dev 준비 단계 실패: ${(err as Error).message}`).catch(() => {})
        clearContext(channelId)
        setPhase(channelId, { phase: 'idle' })
        options.onDone?.()
        if (options.tempFiles) await cleanup(options.tempFiles)
      }
    },
  })

  return designChild
}
