import type {
  ActivityStats,
  CommitNode,
  CommitRelationshipGraph,
  DailyActivityItem,
  GithubBranch,
  GithubCommit,
  GithubCommitDetail,
  GithubContributionDay,
  GithubEvent,
  GithubRepository,
  GithubUser,
  MonthSectionData,
  ProcessedActivity,
} from '../types/github';

const GITHUB_API_URL = 'https://api.github.com/users';
const GITHUB_REPOS_API_URL = 'https://api.github.com/repos';

export class GithubApiError extends Error {
  constructor(public readonly kind: 'not-found' | 'unexpected' | 'network') {
    super(kind);
    this.name = 'GithubApiError';
  }
}

function isGithubUser(value: unknown): value is GithubUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.avatar_url === 'string' && typeof user.login === 'string' &&
    (typeof user.name === 'string' || user.name === null) &&
    (typeof user.bio === 'string' || user.bio === null) &&
    (typeof user.location === 'string' || user.location === null) &&
    (typeof user.company === 'string' || user.company === null) &&
    typeof user.blog === 'string' && typeof user.followers === 'number' &&
    typeof user.following === 'number' && typeof user.public_repos === 'number' &&
    typeof user.created_at === 'string' && typeof user.html_url === 'string';
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isGithubRepository(value: unknown): value is GithubRepository {
  if (!value || typeof value !== 'object') return false;
  const repository = value as Record<string, unknown>;
  return typeof repository.id === 'number' && typeof repository.name === 'string' &&
    typeof repository.full_name === 'string' && isStringOrNull(repository.description) &&
    typeof repository.html_url === 'string' && isStringOrNull(repository.homepage) &&
    isStringOrNull(repository.language) && typeof repository.stargazers_count === 'number' &&
    typeof repository.forks_count === 'number' && typeof repository.open_issues_count === 'number' &&
    typeof repository.visibility === 'string' && typeof repository.private === 'boolean' &&
    typeof repository.created_at === 'string' && typeof repository.updated_at === 'string' &&
    isStringOrNull(repository.pushed_at) && typeof repository.default_branch === 'string';
}

function isGithubBranch(value: unknown): value is GithubBranch {
  if (!value || typeof value !== 'object') return false;
  const branch = value as Record<string, unknown>;
  if (typeof branch.name !== 'string' || typeof branch.protected !== 'boolean') return false;
  if (!branch.commit || typeof branch.commit !== 'object') return false;
  const commit = branch.commit as Record<string, unknown>;
  return typeof commit.sha === 'string' && typeof commit.url === 'string';
}

export async function fetchGithubUser(username: string): Promise<GithubUser> {
  let response: Response;
  try {
    response = await fetch(`${GITHUB_API_URL}/${encodeURIComponent(username)}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new GithubApiError('network');
  }

  if (response.status === 404) throw new GithubApiError('not-found');
  if (!response.ok) throw new GithubApiError('network');

  try {
    const data: unknown = await response.json();
    if (!isGithubUser(data)) throw new GithubApiError('unexpected');
    return data;
  } catch (error) {
    if (error instanceof GithubApiError) throw error;
    throw new GithubApiError('unexpected');
  }
}

export async function fetchGithubRepositories(username: string): Promise<GithubRepository[]> {
  let response: Response;
  try {
    response = await fetch(`${GITHUB_API_URL}/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new GithubApiError('network');
  }

  if (response.status === 404) throw new GithubApiError('not-found');
  if (!response.ok) throw new GithubApiError('unexpected');

  try {
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(isGithubRepository)) throw new GithubApiError('unexpected');
    return data;
  } catch (error) {
    if (error instanceof GithubApiError) throw error;
    throw new GithubApiError('unexpected');
  }
}

export async function fetchGithubBranches(owner: string, repo: string): Promise<GithubBranch[]> {
  let response: Response;
  try {
    response = await fetch(`${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new GithubApiError('network');
  }

  if (response.status === 404) throw new GithubApiError('not-found');
  if (!response.ok) throw new GithubApiError('unexpected');

  try {
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(isGithubBranch)) throw new GithubApiError('unexpected');
    return data;
  } catch (error) {
    if (error instanceof GithubApiError) throw error;
    throw new GithubApiError('unexpected');
  }
}

function isGithubCommit(value: unknown): value is GithubCommit {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.sha !== 'string' || typeof item.html_url !== 'string') return false;
  if (!item.commit || typeof item.commit !== 'object') return false;
  const commit = item.commit as Record<string, unknown>;
  if (typeof commit.message !== 'string') return false;
  if (!Array.isArray(item.parents)) return false;
  return true;
}

export async function fetchGithubCommits(
  owner: string,
  repo: string,
  branch?: string,
  page: number = 1,
  perPage: number = 15
): Promise<GithubCommit[]> {
  let response: Response;
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (branch) query.set('sha', branch);

  try {
    response = await fetch(
      `${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${query.toString()}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
      }
    );
  } catch {
    throw new GithubApiError('network');
  }

  if (response.status === 404) throw new GithubApiError('not-found');
  if (!response.ok) throw new GithubApiError('unexpected');

  try {
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(isGithubCommit)) throw new GithubApiError('unexpected');
    return data;
  } catch (error) {
    if (error instanceof GithubApiError) throw error;
    throw new GithubApiError('unexpected');
  }
}

export async function fetchGithubCommitDetail(
  owner: string,
  repo: string,
  sha: string
): Promise<GithubCommitDetail> {
  let response: Response;
  try {
    response = await fetch(
      `${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(sha)}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
      }
    );
  } catch {
    throw new GithubApiError('network');
  }

  if (response.status === 404) throw new GithubApiError('not-found');
  if (!response.ok) throw new GithubApiError('unexpected');

  try {
    const data: unknown = await response.json();
    if (!isGithubCommit(data)) throw new GithubApiError('unexpected');
    return data as GithubCommitDetail;
  } catch (error) {
    if (error instanceof GithubApiError) throw error;
    throw new GithubApiError('unexpected');
  }
}

/**
 * Builds a deterministic, bidirectional Commit Relationship Model (parent <-> child DAG)
 * from real GitHub commit history.
 */
export function buildCommitRelationshipModel(commits: GithubCommit[]): CommitRelationshipGraph {
  const nodes: Record<string, CommitNode> = {};
  const orderedShas: string[] = [];

  // Pass 1: Instantiate individual commit nodes
  for (const commit of commits) {
    const sha = commit.sha;
    if (!sha || nodes[sha]) continue;

    const parentShas = Array.isArray(commit.parents)
      ? commit.parents
          .map((p) => p.sha)
          .filter((s): s is string => typeof s === 'string' && s.length > 0)
      : [];

    const date = commit.commit.author?.date || commit.commit.committer?.date || new Date().toISOString();
    const name = commit.commit.author?.name || commit.commit.committer?.name || commit.author?.login || 'Unknown Author';
    const email = commit.commit.author?.email || commit.commit.committer?.email || null;
    const avatarUrl = commit.author?.avatar_url || commit.committer?.avatar_url || null;
    const login = commit.author?.login || commit.committer?.login || null;

    nodes[sha] = {
      sha,
      shortSha: sha.slice(0, 7),
      message: commit.commit.message,
      author: {
        name,
        email,
        date,
        avatarUrl,
        login,
      },
      timestamp: date,
      parentShas,
      childShas: [],
      isMerge: parentShas.length > 1,
      isRoot: parentShas.length === 0,
      htmlUrl: commit.html_url,
      rawCommit: commit,
    };

    orderedShas.push(sha);
  }

  // Pass 2: Establish bidirectional parent -> child relationship links
  for (const sha of orderedShas) {
    const node = nodes[sha];
    if (!node) continue;

    for (const parentSha of node.parentShas) {
      const parentNode = nodes[parentSha];
      if (parentNode && !parentNode.childShas.includes(sha)) {
        parentNode.childShas.push(sha);
      }
    }
  }

  // Pass 3: Identify root commits (0 parents or parents outside the loaded set) and head commits (0 children)
  const rootShas = orderedShas.filter((sha) => nodes[sha].parentShas.length === 0 || !nodes[sha].parentShas.some((pSha) => pSha in nodes));
  const headShas = orderedShas.filter((sha) => nodes[sha].childShas.length === 0);

  return {
    nodes,
    orderedShas,
    rootShas,
    headShas,
    totalCommits: orderedShas.length,
  };
}

export function getParentCommits(graph: CommitRelationshipGraph, sha: string): CommitNode[] {
  const node = graph.nodes[sha];
  if (!node) return [];
  return node.parentShas.map((parentSha) => graph.nodes[parentSha]).filter((p): p is CommitNode => p !== undefined);
}

export function getChildCommits(graph: CommitRelationshipGraph, sha: string): CommitNode[] {
  const node = graph.nodes[sha];
  if (!node) return [];
  return node.childShas.map((childSha) => graph.nodes[childSha]).filter((c): c is CommitNode => c !== undefined);
}

export function getCommitNode(graph: CommitRelationshipGraph, sha: string): CommitNode | undefined {
  return graph.nodes[sha];
}

function isGithubEvent(value: unknown): value is GithubEvent {
  if (!value || typeof value !== 'object') return false;
  const ev = value as Record<string, unknown>;
  return typeof ev.id === 'string' &&
    typeof ev.type === 'string' &&
    typeof ev.created_at === 'string' &&
    typeof ev.repo === 'object' && ev.repo !== null;
}

export async function fetchGithubUserEvents(
  username: string,
  page: number = 1,
  perPage: number = 100
): Promise<GithubEvent[]> {
  let response: Response;
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  try {
    response = await fetch(
      `${GITHUB_API_URL}/${encodeURIComponent(username)}/events?${query.toString()}`,
      {
        headers: { Accept: 'application/vnd.github+json' },
      }
    );
  } catch {
    throw new GithubApiError('network');
  }

  if (response.status === 404) throw new GithubApiError('not-found');
  if (!response.ok) throw new GithubApiError('unexpected');

  try {
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(isGithubEvent)) throw new GithubApiError('unexpected');
    return data;
  } catch (error) {
    if (error instanceof GithubApiError) throw error;
    throw new GithubApiError('unexpected');
  }
}

export async function fetchGithubContributions(username: string): Promise<GithubContributionDay[]> {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
      {
        headers: { Accept: 'application/json' },
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    if (data && Array.isArray(data.contributions)) {
      return data.contributions;
    }
  } catch {
    // Graceful fallback to events
  }
  return [];
}

/**
 * Transforms real GitHub events and full-year contribution data into a processed activity model with statistics,
 * aggregated daily intensities, and calendar grid layout.
 */
export function processUserActivity(
  events: GithubEvent[],
  contributions: GithubContributionDay[] = [],
  weeksCount: number = 52
): ProcessedActivity {
  const stats: ActivityStats = {
    totalEvents: events.length,
    pushEvents: 0,
    totalCommits: 0,
    pullRequestEvents: 0,
    issueEvents: 0,
    createEvents: 0,
    watchEvents: 0,
    forkEvents: 0,
  };

  const dayCounts: Record<string, number> = {};

  // Initialize day counts from full-year contribution calendar
  for (const contrib of contributions) {
    if (contrib && typeof contrib.date === 'string' && typeof contrib.count === 'number') {
      dayCounts[contrib.date] = contrib.count;
    }
  }

  for (const event of events) {
    const dateKey = event.created_at.split('T')[0];
    let weight = 1;

    switch (event.type) {
      case 'PushEvent': {
        stats.pushEvents += 1;
        const commitsCount = event.payload.commits?.length ?? event.payload.size ?? 1;
        stats.totalCommits += commitsCount;
        weight = commitsCount;
        break;
      }
      case 'PullRequestEvent':
        stats.pullRequestEvents += 1;
        weight = 2;
        break;
      case 'IssuesEvent':
      case 'IssueCommentEvent':
        stats.issueEvents += 1;
        break;
      case 'CreateEvent':
        stats.createEvents += 1;
        break;
      case 'WatchEvent':
        stats.watchEvents += 1;
        break;
      case 'ForkEvent':
        stats.forkEvents += 1;
        break;
      default:
        break;
    }

    // Ensure day count is at least the live events weight
    dayCounts[dateKey] = Math.max(dayCounts[dateKey] || 0, weight);
  }

  // Construct calendar grid of weeksCount columns × 7 days
  const today = new Date();
  const dailyGrid: DailyActivityItem[][] = [];
  const monthLabels: { label: string; colIndex: number }[] = [];
  let mostActiveDay: { date: string; count: number } | null = null;
  let totalRecentContributions = 0;

  // Calculate start date: ending on the upcoming Saturday/Sunday of the current week
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  const daysToEndOfWeek = 6 - dayOfWeek;
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysToEndOfWeek);

  const totalDays = weeksCount * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const cursor = new Date(startDate);

  for (let col = 0; col < weeksCount; col++) {
    const week: DailyActivityItem[] = [];

    for (let row = 0; row < 7; row++) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const day = String(cursor.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const count = dayCounts[dateKey] || 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 8) level = 4;
      else if (count >= 5) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      week.push({
        date: dateKey,
        count,
        level,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    dailyGrid.push(week);
  }

  // Construct 12 distinct calendar month sections (each having 28 to 31 day boxes)
  const monthSections: MonthSectionData[] = [];
  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = targetDate.getFullYear();
    const monthIndex = targetDate.getMonth();
    const monthName = targetDate.toLocaleString('en', { month: 'short' });
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDayWeekday = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday, 6 is Saturday

    const columns: (DailyActivityItem | null)[][] = [];
    let currentColumn: (DailyActivityItem | null)[] = [];

    // Fill leading empty days in first week column
    for (let r = 0; r < firstDayWeekday; r++) {
      currentColumn.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const count = dayCounts[dateKey] || 0;
      totalRecentContributions += count;

      if (count > 0 && (!mostActiveDay || count > mostActiveDay.count)) {
        mostActiveDay = { date: dateKey, count };
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 8) level = 4;
      else if (count >= 5) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      currentColumn.push({
        date: dateKey,
        count,
        level,
      });

      if (currentColumn.length === 7) {
        columns.push(currentColumn);
        currentColumn = [];
      }
    }

    // Fill trailing empty days in last week column
    if (currentColumn.length > 0) {
      while (currentColumn.length < 7) {
        currentColumn.push(null);
      }
      columns.push(currentColumn);
    }

    monthSections.push({
      monthName,
      year,
      columns,
      totalDays: daysInMonth,
    });
  }

  return {
    events,
    stats,
    dailyGrid,
    monthSections,
    monthLabels,
    totalRecentContributions,
    mostActiveDay,
  };
}

