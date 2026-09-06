import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, GitBranch, GitCommit, History, RotateCw, Search, ShieldCheck, X } from 'lucide-react';
import { fetchGithubBranches } from '../services/githubApi';
import type { GithubBranch } from '../types/github';
import { CommitHistory } from './CommitHistory';

interface BranchExplorerProps {
  owner: string;
  repo: string;
  defaultBranch: string;
  fullName: string;
  onClose: () => void;
}

export function BranchExplorer({ owner, repo, defaultBranch, fullName, onClose }: BranchExplorerProps) {
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [activeBranchForCommits, setActiveBranchForCommits] = useState<string | null>(null);

  const loadBranches = () => {
    setStatus('loading');
    fetchGithubBranches(owner, repo)
      .then((data) => {
        // Sort default branch first, then alphabetically
        const sorted = [...data].sort((a, b) => {
          if (a.name === defaultBranch) return -1;
          if (b.name === defaultBranch) return 1;
          return a.name.localeCompare(b.name);
        });
        setBranches(sorted);
        setStatus('ready');
      })
      .catch(() => {
        setBranches([]);
        setStatus('error');
      });
  };

  useEffect(() => {
    loadBranches();
  }, [owner, repo]);

  const filteredBranches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => b.name.toLowerCase().includes(q));
  }, [branches, query]);

  if (activeBranchForCommits) {
    return (
      <CommitHistory
        owner={owner}
        repo={repo}
        selectedBranch={activeBranchForCommits}
        fullName={fullName}
        branches={branches}
        onSelectBranch={(b) => setActiveBranchForCommits(b)}
        onBack={() => setActiveBranchForCommits(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="branch-explorer-panel" aria-label={`Branches for ${fullName}`}>
      <div className="branch-explorer-header">
        <div className="branch-explorer-title">
          <GitBranch size={14} className="branch-header-icon" />
          <span>Branches</span>
          {status === 'ready' && <span className="branch-count-badge">{branches.length}</span>}
        </div>
        <div className="branch-header-actions">
          {defaultBranch && (
            <button
              type="button"
              onClick={() => setActiveBranchForCommits(defaultBranch)}
              className="branch-view-commits-quick"
              title={`View commits on ${defaultBranch}`}
              aria-label={`View commits on default branch ${defaultBranch}`}
            >
              <History size={12} />
              <span>History</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="branch-close-button"
            aria-label="Close branch explorer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="branch-skeleton-list" aria-label="Loading branches">
          <div className="branch-skeleton-card">
            <span className="branch-skeleton-icon" />
            <span className="branch-skeleton-title" />
            <span className="branch-skeleton-meta" />
          </div>
          <div className="branch-skeleton-card">
            <span className="branch-skeleton-icon" />
            <span className="branch-skeleton-title" />
            <span className="branch-skeleton-meta" />
          </div>
          <div className="branch-skeleton-card">
            <span className="branch-skeleton-icon" />
            <span className="branch-skeleton-title" />
            <span className="branch-skeleton-meta" />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="branch-error-box">
          <p>Failed to load branches for this repository.</p>
          <button type="button" onClick={loadBranches} className="branch-retry-btn">
            <RotateCw size={12} /> Retry
          </button>
        </div>
      )}

      {status === 'ready' && branches.length === 0 && (
        <div className="branch-empty-box">
          <p>No branches found for this repository.</p>
        </div>
      )}

      {status === 'ready' && branches.length > 0 && (
        <>
          {branches.length > 3 && (
            <div className="branch-search-bar">
              <Search size={12} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a branch..."
                aria-label="Filter branches"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="branch-clear-search" aria-label="Clear branch search">
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {filteredBranches.length === 0 ? (
            <div className="branch-empty-box">
              <p>No branches matching "{query}"</p>
            </div>
          ) : (
            <ul className="branch-list">
              {filteredBranches.map((branch) => {
                const isDefault = branch.name === defaultBranch;
                return (
                  <li key={branch.name} className={`branch-item ${isDefault ? 'is-default' : ''}`}>
                    <div className="branch-item-name">
                      <GitBranch size={13} className="branch-item-icon" />
                      <span className="branch-name-text" title={branch.name}>{branch.name}</span>
                      {isDefault && (
                        <span className="branch-badge default-badge" title="Default branch">
                          default
                        </span>
                      )}
                      {branch.protected && (
                        <span className="branch-badge protected-badge" title="Protected branch">
                          <ShieldCheck size={10} /> protected
                        </span>
                      )}
                    </div>

                    <div className="branch-item-meta">
                      <button
                        type="button"
                        onClick={() => setActiveBranchForCommits(branch.name)}
                        className="branch-commits-btn"
                        title={`View commits on ${branch.name}`}
                        aria-label={`View commits on ${branch.name}`}
                      >
                        <History size={11} />
                        <span>Commits</span>
                      </button>

                      {branch.commit?.sha && (
                        <a
                          href={`https://github.com/${owner}/${repo}/commit/${branch.commit.sha}`}
                          target="_blank"
                          rel="noreferrer"
                          className="branch-commit-sha"
                          title={`Commit ${branch.commit.sha}`}
                          aria-label={`Commit ${branch.commit.sha.slice(0, 7)} on GitHub`}
                        >
                          <GitCommit size={11} />
                          <code>{branch.commit.sha.slice(0, 7)}</code>
                        </a>
                      )}
                      <a
                        href={`https://github.com/${owner}/${repo}/tree/${encodeURIComponent(branch.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="branch-external-link"
                        title={`View ${branch.name} branch on GitHub`}
                        aria-label={`View ${branch.name} branch on GitHub`}
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
