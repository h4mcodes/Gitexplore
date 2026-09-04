import type { GithubUser } from '../types/github';

const GITHUB_API_URL = 'https://api.github.com/users';

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
