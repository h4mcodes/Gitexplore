import { motion } from 'framer-motion';
import { CircleDot, Clock3, ExternalLink, GitFork, Globe2, Star } from 'lucide-react';
import type { GithubRepository } from '../types/github';

type PreviewRepoCardProps = { name: string; description: string; language: string; color: string; stars: string };
type GithubRepoCardProps = { repository: GithubRepository; index: number };
type RepoCardProps = PreviewRepoCardProps | GithubRepoCardProps;

function formatUpdatedDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function normaliseHomepage(homepage: string) {
  return homepage.startsWith('http://') || homepage.startsWith('https://') ? homepage : `https://${homepage}`;
}

export function RepoCard(props: RepoCardProps) {
  if ('repository' in props) {
    const { repository, index } = props;
    return <motion.article className="repository-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3, delay: Math.min(index * .04, .24), ease: 'easeOut' }} whileHover={{ y: -3 }}><div className="repository-card-heading"><div className="repository-name"><CircleDot size={15} /><h3>{repository.name}</h3></div><span className="repository-visibility">{repository.visibility}</span></div>{repository.description && <p className="repository-description">{repository.description}</p>}<div className="repository-details"><span className="repository-language"><i />{repository.language || 'No primary language'}</span><span><Star size={14} />{repository.stargazers_count.toLocaleString()}</span><span><GitFork size={14} />{repository.forks_count.toLocaleString()}</span><span><CircleDot size={14} />{repository.open_issues_count.toLocaleString()}</span></div><div className="repository-card-footer"><span><Clock3 size={13} />Updated {formatUpdatedDate(repository.updated_at)}</span><div className="repository-links">{repository.homepage && <a href={normaliseHomepage(repository.homepage)} target="_blank" rel="noreferrer" aria-label={`Open ${repository.name} homepage`}><Globe2 size={14} /></a>}<a href={repository.html_url} target="_blank" rel="noreferrer" aria-label={`Open ${repository.name} on GitHub`}><ExternalLink size={14} /></a></div></div></motion.article>;
  }

  const { name, description, language, color, stars } = props;
  return <div className="repo-card preview-surface"><div className="repo-title"><span className="repo-dot" />{name}</div><p>{description}</p><div className="repo-footer"><span><i style={{ background: color }} />{language}</span><span><Star size={13} /> {stars}</span><span><GitFork size={13} /> 24</span></div></div>;
}
