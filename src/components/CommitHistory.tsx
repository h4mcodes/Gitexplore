import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitMerge,
  RotateCw,
  Search,
  X,
} from 'lucide-react';
import { buildCommitRelationshipModel, fetchGithubCommits } from '../services/githubApi';
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
  const [selectedSha, setSelectedSha] = useState<string | null>(null);

  const loadInitialCommits = () => {
    setStatus('loading');
    setPage(1);
    setHasMore(true);
    setSelectedSha(null);
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

  // Build the deterministic commit relationship DAG model
  const commitGraph = useMemo(() => {
    return buildCommitRelationshipModel(commits);
  }, [commits]);

  const stats = useMemo(() => {
    const total = commitGraph.totalCommits;
    const mergeCount = Object.values(commitGraph.nodes).filter((n) => n.isMerge).length;
    return { total, mergeCount };
  }, [commitGraph]);

  const filteredCommits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commits;
    return commits.filter((c) => {
      const message = c.commit.message.toLowerCase();
      const authorName = (c.commit.author?.name || c.author?.login || '').toLowerCase();
      return message.includes(q) || authorName.includes(q) || c.sha.toLowerCase().startsWith(q);
    });
  }, [commits, query]);

  const scrollToSha = (targetSha: string) => {
    setSelectedSha(targetSha);
    const element = document.getElementById(`commit-node-${targetSha}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="commit-history-panel" aria-label={`Commit history for ${fullName} on branch ${selectedBranch}`}>
      <div className="commit-history-header">
        <div className="commit-header-left">
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
          <div className="commit-title-group">
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

        <div className="commit-header-right">
          {status === 'ready' && commits.length > 0 && (
            <div className="commit-model-badge" title="Commit Relationship Model Active">
              <span>{stats.total} nodes</span>
              {stats.mergeCount > 0 && (
                <>
                  <span className="commit-badge-dot">·</span>
                  <span>{stats.mergeCount} {stats.mergeCount === 1 ? 'merge' : 'merges'}</span>
                </>
              )}
            </div>
          )}

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
      </div>

      {status === 'loading' && (
        <div className="commit-skeleton-list" aria-label="Loading commit history">
          <div className="commit-skeleton-card">
            <div className="commit-skeleton-top">
              <span className="commit-skeleton-avatar" />
              <span className="commit-skeleton-title" />
              <span className="commit-skeleton-actions" />
            </div>
            <div className="commit-skeleton-bottom">
              <span className="commit-skeleton-meta" />
            </div>
          </div>
          <div className="commit-skeleton-card">
            <div className="commit-skeleton-top">
              <span className="commit-skeleton-avatar" />
              <span className="commit-skeleton-title" />
              <span className="commit-skeleton-actions" />
            </div>
            <div className="commit-skeleton-bottom">
              <span className="commit-skeleton-meta" />
            </div>
          </div>
          <div className="commit-skeleton-card">
            <div className="commit-skeleton-top">
              <span className="commit-skeleton-avatar" />
              <span className="commit-skeleton-title" />
              <span className="commit-skeleton-actions" />
            </div>
            <div className="commit-skeleton-bottom">
              <span className="commit-skeleton-meta" />
            </div>
          </div>
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
          {commits.length > 3 && (
            <div className="commit-search-bar">
              <Search size={12} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commit message, author, or SHA..."
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
                const node = commitGraph.nodes[item.sha];
                const authorName = item.author?.login || item.commit.author?.name || 'Unknown';
                const avatarUrl = item.author?.avatar_url;
                const commitDate = item.commit.author?.date;
                const lines = item.commit.message.split('\n');
                const title = lines[0];
                const isSelected = selectedSha === item.sha;

                return (
                  <li
                    key={item.sha}
                    id={`commit-node-${item.sha}`}
                    className={`commit-item ${isSelected ? 'is-selected' : ''}`}
                  >
                    <div className="commit-item-main">
                      {/* Left: Avatar */}
                      <div className="commit-avatar-wrap">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={authorName} className="commit-avatar" />
                        ) : (
                          <span className="commit-avatar-fallback">
                            {authorName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Middle: Content */}
                      <div className="commit-item-content">
                        <div className="commit-title-row">
                          <span className="commit-message-text" title={item.commit.message}>
                            {title}
                          </span>
                          {node?.isMerge && (
                            <span className="commit-type-tag merge-tag" title="Merge commit (multiple parents)">
                              <GitMerge size={9} /> MERGE
                            </span>
                          )}
                          {node?.isRoot && (
                            <span className="commit-type-tag root-tag" title="Initial commit (no parents)">
                              INITIAL
                            </span>
                          )}
                        </div>

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

                      {/* Right: Actions */}
                      <div className="commit-item-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSha(isSelected ? null : item.sha)}
                          className={`commit-relation-toggle ${isSelected ? 'active' : ''}`}
                          title="Inspect parent-child commit lineage"
                          aria-label="Inspect commit relationships"
                        >
                          <CornerDownRight size={10} />
                          <span>Lineage</span>
                          {isSelected ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>

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
                          <ExternalLink size={10} className="commit-ext-icon" />
                        </a>
                      </div>
                    </div>

                    {/* Commit Relationship Lineage Panel */}
                    {isSelected && node && (
                      <div className="commit-lineage-drawer">
                        <div className="lineage-section">
                          <span className="lineage-label">Parents:</span>
                          {node.parentShas.length === 0 ? (
                            <span className="lineage-empty">None (initial commit)</span>
                          ) : (
                            <div className="lineage-pill-group">
                              {node.parentShas.map((pSha) => {
                                const inList = pSha in commitGraph.nodes;
                                return (
                                  <button
                                    type="button"
                                    key={pSha}
                                    onClick={() => inList && scrollToSha(pSha)}
                                    className={`lineage-sha-link ${inList ? 'is-navigable' : 'is-external'}`}
                                    title={inList ? `Jump to parent commit ${pSha}` : `Parent commit ${pSha} (not in loaded batch)`}
                                  >
                                    <code>{pSha.slice(0, 7)}</code>
                                    {inList && <span className="lineage-jump-hint">jump</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="lineage-section">
                          <span className="lineage-label">Children:</span>
                          {node.childShas.length === 0 ? (
                            <span className="lineage-empty">Head / Latest loaded in branch</span>
                          ) : (
                            <div className="lineage-pill-group">
                              {node.childShas.map((cSha) => (
                                <button
                                  type="button"
                                  key={cSha}
                                  onClick={() => scrollToSha(cSha)}
                                  className="lineage-sha-link is-navigable"
                                  title={`Jump to child commit ${cSha}`}
                                >
                                  <code>{cSha.slice(0, 7)}</code>
                                  <span className="lineage-jump-hint">jump</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
