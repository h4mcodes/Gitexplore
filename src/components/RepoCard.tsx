import { GitFork, Star } from 'lucide-react';

type RepoCardProps = { name: string; description: string; language: string; color: string; stars: string };

export function RepoCard({ name, description, language, color, stars }: RepoCardProps) {
  return <div className="repo-card preview-surface"><div className="repo-title"><span className="repo-dot" />{name}</div><p>{description}</p><div className="repo-footer"><span><i style={{ background: color }} />{language}</span><span><Star size={13} /> {stars}</span><span><GitFork size={13} /> 24</span></div></div>;
}
