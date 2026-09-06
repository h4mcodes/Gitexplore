import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, GitBranch, GitCommit, RotateCw, Search, X } from 'lucide-react';
import { fetchGithubCommits } from '../services/githubApi';
import type { GithubBranch, GithubCommit } from '../types/github';

interface CommitHistoryProps {
  owner: string;
  repo: string;
  selectedBranch: string;
  fullName: string;
  branches?: GithubBranch[];
  onSelectBranch?: (branchName: string) => void;
  onBack?: () => void;
  onClose?: () => void;
}

const COMMITS_PER_PAGE = 15;

function formatCommitDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours}h ago`;
    }
    if (diffSeconds < 604800) {
      const days = Math.floor(diffSeconds / 86400);
      return `${days}d ago`;
    }
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  } catch {
    return dateString;
  }
}

export function CommitHistory({
  owner,
  repo,
  selectedBranch,
  fullName,
  branches,
  onSelectBranch,
  onBack,
  onClose,
}: CommitHistoryProps) {
  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState('');

  const loadInitialCommits = () => {
    setStatus('loading');
    setPage(1);
    setHasMore(true);
    fetchGithubCommits(owner, repo, selectedBranch, 1, COMMITS_PER_PAGE)
      .then((data) => {
        setCommits(data);
        setHasMore(data.length >= COMMITS_PER_PAGE);
        setStatus('ready');
      })
      .catch(() => {
        setCommits([]);
        setStatus('error');
      });
  };

  const loadMoreCommits = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchGithubCommits(owner, repo, selectedBranch, nextPage, COMMITS_PER_PAGE)
      .then((data) => {
        setCommits((prev) => {
          const existingShas = new Set(prev.map((c) => c.sha));
          const newItems = data.filter((c) => !existingShas.has(c.sha));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
        setHasMore(data.length >= COMMITS_PER_PAGE);
        setLoadingMore(false);
      })
      .catch(() => {
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    loadInitialCommits();
  }, [owner, repo, selectedBranch]);

  const filteredCommits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commits;
    return commits.filter((c) => {
      const message = c.commit.message.toLowerCase();
      const authorName = (c.commit.author?.name || c.author?.login || '').toLowerCase();
      return message.includes(q) || authorName.includes(q) || c.sha.toLowerCase().startsWith(q);
    });
  }, [commits, query]);

  return (
    <div className="commit-history-panel" aria-label={`Commit history for ${fullName} on branch ${selectedBranch}`}>
      <div className="commit-history-header">
        <div className="commit-history-nav">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="commit-back-btn"
              title="Back to branches"
              aria-label="Back to branches"
            >
              <ArrowLeft size={13} />
            </button>
          )}
          <div className="commit-branch-context">
            <GitCommit size={14} className="commit-header-icon" />
            <span className="commit-header-title">Commits</span>
            {branches && onSelectBranch ? (
              <select
                className="commit-branch-select"
                value={selectedBranch}
                onChange={(e) => onSelectBranch(e.target.value)}
                aria-label="Switch branch"
              >
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="commit-branch-tag">
                <GitBranch size={10} />
                {selectedBranch}
              </span>
            )}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="commit-close-btn"
            aria-label="Close commit history"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="commit-skeleton-list" aria-label="Loading commit history">
          <div className="commit-skeleton-item"><span /><span /><span /></div>
          <div className="commit-skeleton-item"><span /><span /><span /></div>
          <div className="commit-skeleton-item"><span /><span /><span /></div>
        </div>
      )}

      {status === 'error' && (
        <div className="commit-error-box">
          <p>Failed to load commit history for this branch.</p>
          <button type="button" onClick={loadInitialCommits} className="commit-retry-btn">
            <RotateCw size={12} /> Retry
          </button>
        </div>
      )}

      {status === 'ready' && commits.length === 0 && (
        <div className="commit-empty-box">
          <p>No commits found on branch "{selectedBranch}".</p>
        </div>
      )}

      {status === 'ready' && commits.length > 0 && (
        <>
          {commits.length > 4 && (
            <div className="commit-search-bar">
              <Search size={12} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commit message or author..."
                aria-label="Filter commits"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="commit-clear-search"
                  aria-label="Clear commit search"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {filteredCommits.length === 0 ? (
            <div className="commit-empty-box">
              <p>No commits matching "{query}"</p>
            </div>
          ) : (
            <ul className="commit-list">
              {filteredCommits.map((item) => {
                const authorName = item.author?.login || item.commit.author?.name || 'Unknown';
                const avatarUrl = item.author?.avatar_url;
                const commitDate = item.commit.author?.date;
                const lines = item.commit.message.split('\n');
                const title = lines[0];

                return (
                  <li key={item.sha} className="commit-item">
                    <div className="commit-item-left">
                      <div className="commit-avatar-wrap">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={authorName} className="commit-avatar" />
                        ) : (
                          <span className="commit-avatar-fallback">
                            {authorName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="commit-item-content">
                        <p className="commit-message-text" title={item.commit.message}>
                          {title}
                        </p>
                        <div className="commit-item-subline">
                          <span className="commit-author-name">{authorName}</span>
                          <span className="commit-dot-sep">·</span>
                          {commitDate && (
                            <span className="commit-date" title={new Date(commitDate).toLocaleString()}>
                              {formatCommitDate(commitDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="commit-item-right">
                      <a
                        href={item.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="commit-sha-pill"
                        title={`View commit ${item.sha} on GitHub`}
                        aria-label={`View commit ${item.sha.slice(0, 7)} on GitHub`}
                      >
                        <GitCommit size={11} />
                        <code>{item.sha.slice(0, 7)}</code>
                      </a>
                      <a
                        href={item.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="commit-external-link"
                        title="Open on GitHub"
                        aria-label="Open commit on GitHub"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && !query && (
            <div className="commit-load-more">
              <button
                type="button"
                onClick={loadMoreCommits}
                disabled={loadingMore}
                className="commit-load-more-btn"
              >
                {loadingMore ? (
                  <>
                    <RotateCw size={12} className="spin" /> Loading commits...
                  </>
                ) : (
                  'Load older commits'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
