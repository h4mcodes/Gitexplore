import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot, Clock3, ExternalLink, GitBranch, GitFork, Globe2, Star } from 'lucide-react';
import type { GithubRepository } from '../types/github';
import { BranchExplorer } from './BranchExplorer';
import { ErrorBoundary } from './ErrorBoundary';
import { sanitizeUrl } from '../services/security';

type PreviewRepoCardProps = { name: string; description: string; language: string; color: string; stars: string };
type GithubRepoCardProps = {
  repository: GithubRepository;
  index: number;
  targetState?: { branch?: string; sha?: string; id: number } | null;
};
type RepoCardProps = PreviewRepoCardProps | GithubRepoCardProps;

function formatUpdatedDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function normaliseHomepage(homepage: string) {
  return homepage.startsWith('http://') || homepage.startsWith('https://') ? homepage : `https://${homepage}`;
}

export const RepoCard = memo(function RepoCard(props: RepoCardProps) {
  const [showBranches, setShowBranches] = useState(false);

  if ('repository' in props) {
    const { repository, index, targetState } = props;
    const [owner, repoName] = repository.full_name.includes('/')
      ? repository.full_name.split('/')
      : ['', repository.name];

    useEffect(() => {
      if (targetState) {
        setShowBranches(true);
      }
    }, [targetState?.id]);

    return (
      <motion.article
        id={`repo-card-${repository.name.toLowerCase()}`}
        data-repo-name={repository.full_name.toLowerCase()}
        className={`repository-card ${showBranches ? 'branches-expanded' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.18), ease: 'easeOut' }}
      >
        <div className="repository-card-heading">
          <div className="repository-name">
            <CircleDot size={15} />
            <h3>{repository.name}</h3>
          </div>
          <span className="repository-visibility">{repository.visibility}</span>
        </div>

        <p className="repository-description">{repository.description || ''}</p>

        <div className="repository-details">
          <span className="repository-language">
            <i />
            {repository.language || 'No primary language'}
          </span>
          <span><Star size={14} />{repository.stargazers_count.toLocaleString()}</span>
          <span><GitFork size={14} />{repository.forks_count.toLocaleString()}</span>
          <span><CircleDot size={14} />{repository.open_issues_count.toLocaleString()}</span>
        </div>

        <div className="repository-card-footer">
          <span><Clock3 size={13} />Updated {formatUpdatedDate(repository.updated_at)}</span>
          <div className="repository-actions">
            <button
              type="button"
              className={`repo-branches-btn ${showBranches ? 'active' : ''}`}
              onClick={() => setShowBranches((prev) => !prev)}
              aria-expanded={showBranches}
              aria-label={`Toggle branch explorer for ${repository.name}`}
            >
              <GitBranch size={13} />
              <span>Branches</span>
            </button>

            <div className="repository-links">
              {repository.homepage && sanitizeUrl(repository.homepage) && (
                <a href={sanitizeUrl(repository.homepage)} target="_blank" rel="noreferrer" aria-label={`Open ${repository.name} homepage`}>
                  <Globe2 size={14} />
                </a>
              )}
              {sanitizeUrl(repository.html_url) && (
                <a href={sanitizeUrl(repository.html_url)} target="_blank" rel="noreferrer" aria-label={`Open ${repository.name} on GitHub`}>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showBranches && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <ErrorBoundary
                fallbackTitle="Branch Explorer Error"
                fallbackMessage={`Failed to render branch graph for ${repository.name}.`}
                isCompact
              >
                <BranchExplorer
                  owner={owner}
                  repo={repoName}
                  defaultBranch={repository.default_branch}
                  fullName={repository.full_name}
                  initialBranch={targetState?.branch || repository.default_branch}
                  initialSha={targetState?.sha}
                  onClose={() => setShowBranches(false)}
                />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    );
  }

  const { name, description, language, color, stars } = props;
  return (
    <div className="repo-card preview-surface">
      <div className="repo-title">
        <span className="repo-dot" />
        {name}
      </div>
      <p>{description}</p>
      <div className="repo-footer">
        <span><i style={{ background: color }} />{language}</span>
        <span><Star size={13} /> {stars}</span>
        <span><GitFork size={13} /> 24</span>
      </div>
    </div>
  );
});
