import type { GithubBranch, GithubRepository, GithubUser } from '../types/github';

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
