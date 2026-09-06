import type {
  CommitNode,
  CommitRelationshipGraph,
  GithubBranch,
  GithubCommit,
  GithubRepository,
  GithubUser,
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
