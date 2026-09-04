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
