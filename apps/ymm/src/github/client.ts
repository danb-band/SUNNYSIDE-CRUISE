import { GITHUB_TOKEN, GITHUB_REPO } from '../config.js'

export interface GitHubIssue {
  number: number
  title: string
  body: string | null
  labels: string[]
  state: string
  url: string
}

export interface GitHubPR {
  number: number
  url: string
}

export async function createIssue(
  title: string,
  body: string,
  labels: string[] = [],
): Promise<number> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN 또는 GITHUB_REPO가 설정되지 않았습니다.')
  }

  const create = async (withLabels: boolean) => {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        ...(withLabels ? { labels } : {}),
      }),
    })
    return res
  }

  let res = await create(labels.length > 0)
  if (!res.ok && labels.length > 0 && res.status === 422) {
    res = await create(false)
  }

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`이슈 생성 실패: ${res.status} ${res.statusText} - ${errorBody}`)
  }

  const data = await res.json() as { number: number }
  return data.number
}

export async function fetchIssue(issueNumber: number): Promise<GitHubIssue> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN 또는 GITHUB_REPO가 설정되지 않았습니다.')
  }

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (res.status === 404) throw new Error(`이슈 #${issueNumber}를 찾을 수 없습니다.`)
  if (!res.ok) throw new Error(`GitHub API 오류: ${res.status} ${res.statusText}`)

  const data = await res.json() as {
    number: number
    title: string
    body: string | null
    labels: Array<{ name: string }>
    state: string
    html_url: string
  }

  return {
    number: data.number,
    title: data.title,
    body: data.body,
    labels: data.labels.map((l) => l.name),
    state: data.state,
    url: data.html_url,
  }
}

export async function createPR(
  issue: GitHubIssue,
  branchName: string,
  baseBranch = 'dev',
  bodyOverride?: string,
  titleOverride?: string,
): Promise<GitHubPR> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GITHUB_TOKEN 또는 GITHUB_REPO가 설정되지 않았습니다.')
  }

  const body = bodyOverride ?? [`closes #${issue.number}`, '', issue.body ?? ''].join('\n').trim()
  const title = titleOverride ?? issue.title

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: baseBranch,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`PR 생성 실패: ${res.status} ${res.statusText} - ${errorBody}`)
  }

  const data = await res.json() as { number: number; html_url: string }
  return { number: data.number, url: data.html_url }
}

export function buildIssuePrompt(issue: GitHubIssue): string {
  const parts = [
    `GitHub Issue #${issue.number}: ${issue.title}`,
    `URL: ${issue.url}`,
  ]

  if (issue.labels.length > 0) {
    parts.push(`Labels: ${issue.labels.join(', ')}`)
  }

  if (issue.body) {
    parts.push('', issue.body)
  }

  parts.push('', '위 이슈를 분석하고 해결하세요.')

  return parts.join('\n')
}
