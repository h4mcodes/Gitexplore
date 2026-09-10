import type {
  ActivityStats,
  CommitNode,
  CommitRelationshipGraph,
  DailyActivityItem,
  GithubBranch,
  GithubCommit,
  GithubCommitDetail,
  GithubComparisonResult,
  GithubContributionDay,
  GithubEvent,
  GithubRepository,
  GithubUser,
  MonthSectionData,
  ProcessedActivity,
} from '../types/github';

const GITHUB_API_URL = 'https://api.github.com/users';
const GITHUB_REPOS_API_URL = 'https://api.github.com/repos';

export interface GithubRateLimitInfo {
  limit: number;
  remaining: number;
  resetEpochSeconds: number;
  resetDate: Date;
  used?: number;
}

export type GithubApiErrorKind = 'not-found' | 'rate-limit' | 'network' | 'unexpected' | 'empty';

export class GithubApiError extends Error {
  constructor(
    public readonly kind: GithubApiErrorKind,
    public readonly status?: number,
    public readonly rateLimitResetDate?: Date,
    public readonly customMessage?: string
  ) {
    super(customMessage || kind);
    this.name = 'GithubApiError';
  }
}

export interface RequestOptions {
  bypassCache?: boolean;
  ttlMs?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export const CACHE_TTL = {
  USER_PROFILE: 5 * 60 * 1000,      // 5 minutes
  REPOSITORIES: 3 * 60 * 1000,      // 3 minutes
  BRANCHES: 2 * 60 * 1000,          // 2 minutes
  COMMITS_LIST: 2 * 60 * 1000,      // 2 minutes
  COMMIT_DETAIL: 15 * 60 * 1000,    // 15 minutes (commit SHAs are immutable)
  COMPARE: 3 * 60 * 1000,           // 3 minutes
  USER_EVENTS: 1 * 60 * 1000,       // 1 minute
  CONTRIBUTIONS: 10 * 60 * 1000,    // 10 minutes
} as const;

// In-memory cache store
const apiCache = new Map<string, CacheEntry<unknown>>();

// In-flight request map for promise sharing / deduplication
const inFlightRequests = new Map<string, Promise<unknown>>();

// Maximum cache entries to prevent uncontrolled memory usage
const MAX_CACHE_ENTRIES = 250;

// Centralized rate-limit status tracking
let latestRateLimit: GithubRateLimitInfo | null = null;

export function getRateLimitStatus(): GithubRateLimitInfo | null {
  return latestRateLimit;
}

export function clearApiCache(): void {
  apiCache.clear();
  inFlightRequests.clear();
}

export function invalidateApiCacheKey(keyPrefix: string): void {
  for (const key of apiCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      apiCache.delete(key);
    }
  }
}

function parseRateLimitHeaders(response: Response): GithubRateLimitInfo | null {
  const limitHeader = response.headers.get('x-ratelimit-limit');
  const remainingHeader = response.headers.get('x-ratelimit-remaining');
  const resetHeader = response.headers.get('x-ratelimit-reset');
  const usedHeader = response.headers.get('x-ratelimit-used');

  if (limitHeader && remainingHeader && resetHeader) {
    const limit = parseInt(limitHeader, 10);
    const remaining = parseInt(remainingHeader, 10);
    const resetEpochSeconds = parseInt(resetHeader, 10);
    const resetDate = new Date(resetEpochSeconds * 1000);
    const used = usedHeader ? parseInt(usedHeader, 10) : undefined;

    const info: GithubRateLimitInfo = {
      limit: isNaN(limit) ? 60 : limit,
      remaining: isNaN(remaining) ? 0 : remaining,
      resetEpochSeconds: isNaN(resetEpochSeconds) ? 0 : resetEpochSeconds,
      resetDate,
      used,
    };
    latestRateLimit = info;
    return info;
  }
  return null;
}

async function executeGithubRequest<T>(
  cacheKey: string,
  url: string,
  validator: (data: unknown) => data is T,
  defaultTtlMs: number,
  options?: RequestOptions
): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory cache if not bypassing
  if (!options?.bypassCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.data as T;
    }
  }

  // 2. Check if identical request is already pending (Promise Deduplication)
  const existingPromise = inFlightRequests.get(cacheKey);
  if (existingPromise) {
    return existingPromise as Promise<T>;
  }

  // 3. Check client-side rate-limit block: if remaining is known to be 0 and reset time is in the future
  if (latestRateLimit && latestRateLimit.remaining === 0 && latestRateLimit.resetDate.getTime() > now) {
    throw new GithubApiError(
      'rate-limit',
      403,
      latestRateLimit.resetDate,
      `GitHub API rate limit exceeded. Resets at ${latestRateLimit.resetDate.toLocaleTimeString()}.`
    );
  }

  // 4. Create in-flight execution promise
  const fetchPromise = (async () => {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' },
      });
    } catch {
      throw new GithubApiError('network');
    }

    const rateLimitInfo = parseRateLimitHeaders(response);

    if (response.status === 404) {
      throw new GithubApiError('not-found', 404);
    }

    if (response.status === 403 || (rateLimitInfo && rateLimitInfo.remaining === 0)) {
      const resetDate = rateLimitInfo?.resetDate || new Date(Date.now() + 60000);
      throw new GithubApiError(
        'rate-limit',
        403,
        resetDate,
        `GitHub API rate limit reached. Resets at ${resetDate.toLocaleTimeString()}.`
      );
    }

    if (!response.ok) {
      throw new GithubApiError('unexpected', response.status);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new GithubApiError('unexpected', response.status);
    }

    if (!validator(data)) {
      throw new GithubApiError('unexpected');
    }

    // Cache the valid result
    const effectiveTtl = options?.ttlMs ?? defaultTtlMs;
    if (effectiveTtl > 0) {
      if (apiCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = apiCache.keys().next().value;
        if (oldestKey) apiCache.delete(oldestKey);
      }
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttlMs: effectiveTtl,
      });
    }

    return data;
  })();

  inFlightRequests.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
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

function isGithubRepositoriesArray(value: unknown): value is GithubRepository[] {
  return Array.isArray(value) && value.every(isGithubRepository);
}

function isGithubBranch(value: unknown): value is GithubBranch {
  if (!value || typeof value !== 'object') return false;
  const branch = value as Record<string, unknown>;
  if (typeof branch.name !== 'string' || typeof branch.protected !== 'boolean') return false;
  if (!branch.commit || typeof branch.commit !== 'object') return false;
  const commit = branch.commit as Record<string, unknown>;
  return typeof commit.sha === 'string' && typeof commit.url === 'string';
}

function isGithubBranchesArray(value: unknown): value is GithubBranch[] {
  return Array.isArray(value) && value.every(isGithubBranch);
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

function isGithubCommitsArray(value: unknown): value is GithubCommit[] {
  return Array.isArray(value) && value.every(isGithubCommit);
}

function isGithubCommitDetail(value: unknown): value is GithubCommitDetail {
  return isGithubCommit(value);
}

function isGithubComparisonResult(value: unknown): value is GithubComparisonResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.status !== 'string' || typeof item.total_commits !== 'number') return false;
  if (!Array.isArray(item.commits) || !Array.isArray(item.files)) return false;
  return true;
}

export async function fetchGithubUser(
  username: string,
  options?: RequestOptions
): Promise<GithubUser> {
  const normalized = username.trim().toLowerCase();
  const cacheKey = `user:${normalized}`;
  const url = `${GITHUB_API_URL}/${encodeURIComponent(username.trim())}`;
  return executeGithubRequest(cacheKey, url, isGithubUser, CACHE_TTL.USER_PROFILE, options);
}

export async function fetchGithubRepositories(
  username: string,
  options?: RequestOptions
): Promise<GithubRepository[]> {
  const normalized = username.trim().toLowerCase();
  const cacheKey = `repos:${normalized}`;
  const url = `${GITHUB_API_URL}/${encodeURIComponent(username.trim())}/repos?per_page=100&sort=updated`;
  return executeGithubRequest(cacheKey, url, isGithubRepositoriesArray, CACHE_TTL.REPOSITORIES, options);
}

export async function fetchGithubBranches(
  owner: string,
  repo: string,
  options?: RequestOptions
): Promise<GithubBranch[]> {
  const cacheKey = `branches:${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}`;
  const url = `${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/branches?per_page=100`;
  return executeGithubRequest(cacheKey, url, isGithubBranchesArray, CACHE_TTL.BRANCHES, options);
}

export async function fetchGithubCommits(
  owner: string,
  repo: string,
  branch?: string,
  page: number = 1,
  perPage: number = 15,
  options?: RequestOptions
): Promise<GithubCommit[]> {
  const branchKey = branch ? branch.trim() : 'default';
  const cacheKey = `commits:${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}:${branchKey}:p${page}:s${perPage}`;
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (branch) query.set('sha', branch);

  const url = `${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/commits?${query.toString()}`;
  return executeGithubRequest(cacheKey, url, isGithubCommitsArray, CACHE_TTL.COMMITS_LIST, options);
}

export async function fetchGithubCommitDetail(
  owner: string,
  repo: string,
  sha: string,
  options?: RequestOptions
): Promise<GithubCommitDetail> {
  const cacheKey = `commit-detail:${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}:${sha.trim().toLowerCase()}`;
  const url = `${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/commits/${encodeURIComponent(sha.trim())}`;
  return executeGithubRequest(cacheKey, url, isGithubCommitDetail, CACHE_TTL.COMMIT_DETAIL, options);
}

export async function fetchGithubCompare(
  owner: string,
  repo: string,
  base: string,
  head: string,
  options?: RequestOptions
): Promise<GithubComparisonResult> {
  const cacheKey = `compare:${owner.trim().toLowerCase()}/${repo.trim().toLowerCase()}:${base.trim()}...${head.trim()}`;
  const url = `${GITHUB_REPOS_API_URL}/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/compare/${encodeURIComponent(base.trim())}...${encodeURIComponent(head.trim())}`;
  return executeGithubRequest(cacheKey, url, isGithubComparisonResult, CACHE_TTL.COMPARE, options);
}

// In-memory graph model cache
const graphModelCache = new Map<string, CommitRelationshipGraph>();

/**
 * Builds an in-memory directed acyclic graph (DAG) of commit relationships
 * with fingerprint caching for maximum performance.
 */
export function buildCommitRelationshipModel(commits: GithubCommit[]): CommitRelationshipGraph {
  if (!commits || commits.length === 0) {
    return {
      nodes: {},
      orderedShas: [],
      rootShas: [],
      headShas: [],
      totalCommits: 0,
    };
  }

  // Quick deterministic fingerprint from length and boundaries
  const fingerprint = `${commits.length}:${commits[0]?.sha || ''}:${commits[commits.length - 1]?.sha || ''}`;
  const cached = graphModelCache.get(fingerprint);
  if (cached) return cached;

  const nodes: Record<string, CommitNode> = {};
  const orderedShas: string[] = [];
  const knownShas = new Set<string>();

  // Pass 1: Instantiate individual commit nodes
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    const sha = commit.sha;
    if (!sha || knownShas.has(sha)) continue;
    knownShas.add(sha);

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

  // Pass 2: Establish bidirectional parent -> child relationship links in O(N)
  for (let i = 0; i < orderedShas.length; i++) {
    const sha = orderedShas[i];
    const node = nodes[sha];
    if (!node) continue;

    for (let p = 0; p < node.parentShas.length; p++) {
      const parentSha = node.parentShas[p];
      const parentNode = nodes[parentSha];
      if (parentNode && !parentNode.childShas.includes(sha)) {
        parentNode.childShas.push(sha);
      }
    }
  }

  // Pass 3: Identify root commits and head commits
  const rootShas: string[] = [];
  const headShas: string[] = [];

  for (let i = 0; i < orderedShas.length; i++) {
    const sha = orderedShas[i];
    const node = nodes[sha];
    if (node.parentShas.length === 0 || !node.parentShas.some((pSha) => knownShas.has(pSha))) {
      rootShas.push(sha);
    }
    if (node.childShas.length === 0) {
      headShas.push(sha);
    }
  }

  const result: CommitRelationshipGraph = {
    nodes,
    orderedShas,
    rootShas,
    headShas,
    totalCommits: orderedShas.length,
  };

  // Keep cache bounded
  if (graphModelCache.size > 50) {
    const oldestKey = graphModelCache.keys().next().value;
    if (oldestKey) graphModelCache.delete(oldestKey);
  }
  graphModelCache.set(fingerprint, result);

  return result;
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

function isGithubEventsArray(value: unknown): value is GithubEvent[] {
  return Array.isArray(value) && value.every(isGithubEvent);
}

export async function fetchGithubUserEvents(
  username: string,
  page: number = 1,
  perPage: number = 100,
  options?: RequestOptions
): Promise<GithubEvent[]> {
  const normalized = username.trim().toLowerCase();
  const cacheKey = `events:${normalized}:p${page}:s${perPage}`;
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const url = `${GITHUB_API_URL}/${encodeURIComponent(username.trim())}/events?${query.toString()}`;
  return executeGithubRequest(cacheKey, url, isGithubEventsArray, CACHE_TTL.USER_EVENTS, options);
}

export async function fetchGithubContributions(
  username: string,
  options?: RequestOptions
): Promise<GithubContributionDay[]> {
  const normalized = username.trim().toLowerCase();
  const cacheKey = `contributions:${normalized}`;
  const now = Date.now();

  if (!options?.bypassCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.data as GithubContributionDay[];
    }
  }

  const existingPromise = inFlightRequests.get(cacheKey);
  if (existingPromise) {
    return existingPromise as Promise<GithubContributionDay[]>;
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(
        `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username.trim())}?y=last`,
        {
          headers: { Accept: 'application/json' },
        }
      );
      if (!response.ok) return [];
      const data = await response.json();
      if (data && Array.isArray(data.contributions)) {
        const contributions = data.contributions as GithubContributionDay[];
        const effectiveTtl = options?.ttlMs ?? CACHE_TTL.CONTRIBUTIONS;
        apiCache.set(cacheKey, {
          data: contributions,
          timestamp: Date.now(),
          ttlMs: effectiveTtl,
        });
        return contributions;
      }
    } catch {
      // Graceful fallback
    }
    return [];
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

/**
 * Transforms real GitHub events and full-year contribution data into a processed activity model with statistics,
 * aggregated daily intensities, and calendar grid layout.
 * Limits the live event stream and category stats strictly to a rolling 72-hour window.
 */
export function processUserActivity(
  events: GithubEvent[],
  contributions: GithubContributionDay[] = [],
  weeksCount: number = 52
): ProcessedActivity {
  const now = Date.now();

  // Filter events strictly to those within the last 72 hours, sorted latest first
  const recentEvents = events
    .filter((ev) => {
      const eventTime = new Date(ev.created_at).getTime();
      return !Number.isNaN(eventTime) && (now - eventTime) <= SEVENTY_TWO_HOURS_MS && eventTime <= now;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats: ActivityStats = {
    totalEvents: recentEvents.length,
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

  for (const event of recentEvents) {
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
    events: recentEvents,
    stats,
    dailyGrid,
    monthSections,
    monthLabels,
    totalRecentContributions,
    mostActiveDay,
  };
}

