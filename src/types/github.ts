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

export interface GithubEventPayloadCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  url: string;
}

export interface GithubEventPayload {
  action?: string;
  ref?: string | null;
  ref_type?: string;
  master_branch?: string;
  description?: string | null;
  pusher_type?: string;
  size?: number;
  distinct_size?: number;
  commits?: GithubEventPayloadCommit[];
  issue?: {
    number: number;
    title: string;
    html_url: string;
    state?: string;
  };
  pull_request?: {
    number: number;
    title: string;
    html_url: string;
    state?: string;
    merged?: boolean;
  };
  forkee?: {
    name: string;
    full_name: string;
    html_url: string;
  };
}

export interface GithubEvent {
  id: string;
  type: string;
  actor: {
    id: number;
    login: string;
    avatar_url: string;
  };
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: GithubEventPayload;
  public: boolean;
  created_at: string;
}

export interface ActivityStats {
  totalEvents: number;
  pushEvents: number;
  totalCommits: number;
  pullRequestEvents: number;
  issueEvents: number;
  createEvents: number;
  watchEvents: number;
  forkEvents: number;
}

export interface DailyActivityItem {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GithubContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GithubYearContributions {
  total: Record<string, number>;
  contributions: GithubContributionDay[];
}

export interface MonthSectionData {
  monthName: string;
  year: number;
  columns: (DailyActivityItem | null)[][];
  totalDays: number;
}

export interface ProcessedActivity {
  events: GithubEvent[];
  stats: ActivityStats;
  dailyGrid: DailyActivityItem[][];
  monthSections: MonthSectionData[];
  monthLabels: { label: string; colIndex: number }[];
  totalRecentContributions: number;
  mostActiveDay: { date: string; count: number } | null;
}

