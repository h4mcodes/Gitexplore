export interface GithubUser {
  avatar_url: string;
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  html_url: string;
}

export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  visibility: string;
  private: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  default_branch: string;
}

export interface GithubBranchCommit {
  sha: string;
  url: string;
}

export interface GithubBranch {
  name: string;
  commit: GithubBranchCommit;
  protected: boolean;
}

export interface GithubCommitAuthorDetail {
  name: string;
  email: string;
  date: string;
}

export interface GithubCommitUserSummary {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface GithubCommitParent {
  sha: string;
  url?: string;
  html_url?: string;
}

export interface GithubCommitData {
  author: GithubCommitAuthorDetail | null;
  committer: GithubCommitAuthorDetail | null;
  message: string;
  comment_count: number;
}

export interface GithubCommit {
  sha: string;
  html_url: string;
  commit: GithubCommitData;
  author: GithubCommitUserSummary | null;
  committer: GithubCommitUserSummary | null;
  parents: GithubCommitParent[];
}

export interface CommitNodeAuthor {
  name: string;
  email: string | null;
  date: string;
  avatarUrl: string | null;
  login: string | null;
}

export interface CommitNode {
  sha: string;
  shortSha: string;
  message: string;
  author: CommitNodeAuthor;
  timestamp: string;
  parentShas: string[];
  childShas: string[];
  isMerge: boolean;
  isRoot: boolean;
  htmlUrl: string;
  rawCommit: GithubCommit;
}

export interface CommitRelationshipGraph {
  nodes: Record<string, CommitNode>;
  orderedShas: string[];
  rootShas: string[];
  headShas: string[];
  totalCommits: number;
}
