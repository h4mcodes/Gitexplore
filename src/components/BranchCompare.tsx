import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  FileMinus,
  FilePlus,
  FileText,
  FolderGit2,
  GitBranch,
  GitCommit,
  RotateCw,
  X,
} from 'lucide-react';
import { fetchGithubCompare, GithubApiError } from '../services/githubApi';
import type { GithubBranch, GithubComparisonResult } from '../types/github';
import { DiffViewer } from './DiffViewer';
import { GlassDropdown, type DropdownOption } from './GlassDropdown';

interface BranchCompareProps {
  owner: string;
  repo: string;
  fullName: string;
  branches: GithubBranch[];
  initialBase: string;
  initialHead: string;
  onBack: () => void;
  onClose?: () => void;
  onInspectCommit?: (sha: string) => void;
}

function formatDetailDate(dateString: string): { relative: string; full: string } {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let relative = 'just now';
    if (diffSeconds < 60) relative = 'just now';
    else if (diffSeconds < 3600) relative = `${Math.floor(diffSeconds / 60)}m ago`;
    else if (diffSeconds < 86400) relative = `${Math.floor(diffSeconds / 3600)}h ago`;
    else if (diffSeconds < 604800) relative = `${Math.floor(diffSeconds / 86400)}d ago`;
    else relative = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

    const full = new Intl.DateTimeFormat('en', {
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(date);

    return { relative, full };
  } catch {
    return { relative: dateString, full: dateString };
  }
}

export function BranchCompare({
  owner,
  repo,
  fullName,
  branches,
  initialBase,
  initialHead,
  onBack,
  onClose,
  onInspectCommit,
}: BranchCompareProps) {
  const [base, setBase] = useState(initialBase);
  const [head, setHead] = useState(initialHead);
  const [comparison, setComparison] = useState<GithubComparisonResult | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'rate-limit' | 'error'>('loading');
  const [rateLimitTime, setRateLimitTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'commits' | 'files'>('commits');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const runComparison = (b: string, h: string, bypassCache = false) => {
    if (!b || !h) return;
    setStatus('loading');
    fetchGithubCompare(owner, repo, b, h, { bypassCache })
      .then((data) => {
        setComparison(data);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        setComparison(null);
        if (err instanceof GithubApiError && err.kind === 'rate-limit') {
          setStatus('rate-limit');
          setRateLimitTime(
            err.rateLimitResetDate
              ? err.rateLimitResetDate.toLocaleTimeString()
              : null
          );
        } else {
          setStatus('error');
        }
      });
  };

  useEffect(() => {
    runComparison(base, head);
    setShowCodeModal(false);
  }, [owner, repo, base, head]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCodeModal) {
        setShowCodeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCodeModal]);

  const handleSwap = () => {
    const prevBase = base;
    const prevHead = head;
    setBase(prevHead);
    setHead(prevBase);
  };

  const copyToClipboard = (text: string, sha: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSha(sha);
      setTimeout(() => setCopiedSha(null), 2000);
    }).catch(() => {
      // Fallback
    });
  };

  const files = comparison?.files || [];
  const commits = comparison?.commits || [];

  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    for (const f of files) {
      additions += f.additions || 0;
      deletions += f.deletions || 0;
    }
    return {
      additions,
      deletions,
      net: additions - deletions,
    };
  }, [files]);

  const branchOptions: DropdownOption[] = useMemo(() => {
    return branches.map((b) => ({ value: b.name, label: b.name }));
  }, [branches]);

  return (
    <div className="commit-inspection-panel" aria-label="Branch and Commit Comparison">
      {/* Compare Header */}
      <div className="commit-inspect-header">
        <div className="commit-inspect-nav-left">
          <button
            type="button"
            onClick={onBack}
            className="commit-inspect-back-btn"
            title="Back to branch explorer"
            aria-label="Back to branch explorer"
          >
            <ArrowLeft size={13} />
          </button>
          <div className="commit-inspect-context">
            <span className="commit-inspect-repo-label">
              <FolderGit2 size={12} />
              {fullName}
            </span>
            <span className="commit-inspect-divider">/</span>
            <span className="compare-header-title-badge">
              <GitBranch size={10} />
              Compare
            </span>
          </div>
        </div>

        <div className="commit-inspect-nav-right">
          {status === 'ready' && comparison && (
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="show-code-nav-btn"
              title="Inspect full code diff"
              aria-label="Inspect full code diff"
            >
              <FileCode size={12} />
              <span>Show Code</span>
            </button>
          )}
          {comparison?.html_url && (
            <a
              href={comparison.html_url}
              target="_blank"
              rel="noreferrer"
              className="commit-inspect-github-link"
              aria-label="View comparison on GitHub"
            >
              <ExternalLink size={12} />
              <span>GitHub</span>
            </a>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="commit-close-btn"
              title="Close comparison"
              aria-label="Close comparison"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Ref Selector Bar */}
      <div className="compare-selector-bar">
        <div className="compare-ref-block">
          <span className="compare-ref-label">Base:</span>
          <div className="compare-select-wrap">
            <GitBranch size={11} className="compare-select-icon" />
            <GlassDropdown
              value={base}
              options={branchOptions}
              onChange={setBase}
              ariaLabel="Select base branch"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="compare-swap-btn"
          title="Swap base and head branches"
          aria-label="Swap base and head branches"
        >
          <ArrowLeftRight size={13} />
        </button>

        <div className="compare-ref-block">
          <span className="compare-ref-label">Head:</span>
          <div className="compare-select-wrap">
            <GitBranch size={11} className="compare-select-icon" />
            <GlassDropdown
              value={head}
              options={branchOptions}
              onChange={setHead}
              ariaLabel="Select head branch"
            />
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {status === 'loading' && (
        <div className="commit-inspect-skeleton" aria-label="Loading comparison data">
          <div className="skeleton-line title-skel" />
          <div className="skeleton-line meta-skel" />
          <div className="skeleton-stats-row">
            <div className="skeleton-stat-box" />
            <div className="skeleton-stat-box" />
            <div className="skeleton-stat-box" />
          </div>
          <div className="skeleton-files-skel">
            <div className="skeleton-file-item" />
            <div className="skeleton-file-item" />
          </div>
        </div>
      )}

      {/* Rate Limit View */}
      {status === 'rate-limit' && (
        <div className="commit-error-box">
          <p>
            GitHub API rate limit reached (60 req/hr). {rateLimitTime ? `Resets at ${rateLimitTime}.` : 'Please wait a moment.'}
          </p>
          <button
            type="button"
            onClick={() => runComparison(base, head, true)}
            className="commit-retry-btn"
          >
            <RotateCw size={12} /> Retry Comparison
          </button>
        </div>
      )}

      {/* Error View */}
      {status === 'error' && (
        <div className="commit-error-box">
          <p>
            Failed to compare ref <code>{base}</code> with <code>{head}</code>.
          </p>
          <button
            type="button"
            onClick={() => runComparison(base, head, true)}
            className="commit-retry-btn"
          >
            <RotateCw size={12} /> Retry Comparison
          </button>
        </div>
      )}

      {/* Ready Comparison Content */}
      {status === 'ready' && comparison && (
        <div className="commit-inspect-body">
          {/* Comparison Status & Impact Overview Card */}
          <div className="commit-inspect-card stats-card">
            <div className="stats-header-row">
              <div className="divergence-status-badge-wrap">
                {comparison.status === 'ahead' && (
                  <span className="divergence-tag ahead-tag">
                    Head <code>{head}</code> is ahead by {comparison.ahead_by} commit{comparison.ahead_by === 1 ? '' : 's'}
                  </span>
                )}
                {comparison.status === 'behind' && (
                  <span className="divergence-tag behind-tag">
                    Head <code>{head}</code> is behind by {comparison.behind_by} commit{comparison.behind_by === 1 ? '' : 's'}
                  </span>
                )}
                {comparison.status === 'identical' && (
                  <span className="divergence-tag identical-tag">
                    Branches are identical (0 commits difference)
                  </span>
                )}
                {comparison.status === 'diverged' && (
                  <span className="divergence-tag diverged-tag">
                    Diverged: +{comparison.ahead_by} ahead / -{comparison.behind_by} behind
                  </span>
                )}
              </div>

              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="show-code-primary-btn"
                  title="Open full code diff window"
                >
                  <FileCode size={12} />
                  <span>Show Code ({files.length})</span>
                </button>
              )}
            </div>

            {/* Metrics Row */}
            <div className="commit-inspect-metrics-row">
              <div className="inspect-metric-pill">
                <GitCommit size={12} className="metric-icon" />
                <span className="metric-val">{comparison.total_commits}</span>
                <span className="metric-lbl">
                  {comparison.total_commits === 1 ? 'commit' : 'commits'}
                </span>
              </div>

              <div className="inspect-metric-pill">
                <FileText size={12} className="metric-icon" />
                <span className="metric-val">{files.length}</span>
                <span className="metric-lbl">
                  {files.length === 1 ? 'file changed' : 'files changed'}
                </span>
              </div>

              <div className="inspect-metric-pill text-emerald">
                <FilePlus size={12} className="metric-icon" />
                <span className="metric-val">+{stats.additions.toLocaleString()}</span>
                <span className="metric-lbl">additions</span>
              </div>

              <div className="inspect-metric-pill text-rose">
                <FileMinus size={12} className="metric-icon" />
                <span className="metric-val">-{stats.deletions.toLocaleString()}</span>
                <span className="metric-lbl">deletions</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Commits vs Changed Files) */}
          <div className="compare-tabs-bar">
            <button
              type="button"
              onClick={() => setActiveTab('commits')}
              className={`compare-tab-btn ${activeTab === 'commits' ? 'active' : ''}`}
            >
              <GitCommit size={12} />
              <span>Commits ({commits.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`compare-tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            >
              <FileText size={12} />
              <span>Changed Files ({files.length})</span>
            </button>
          </div>

          {/* COMMITS TAB CONTENT */}
          {activeTab === 'commits' && (
            <div className="commit-inspect-card">
              {commits.length === 0 ? (
                <div className="diff-empty-state">
                  <p>No commits found between <code>{base}</code> and <code>{head}</code>.</p>
                </div>
              ) : (
                <ul className="compare-commits-list">
                  {commits.map((c) => {
                    const commitMsg = c.commit.message.split('\n')[0] || '';
                    const authorName = c.author?.login || c.commit.author?.name || 'Unknown';
                    const authorAvatar = c.author?.avatar_url;
                    const dateStr = c.commit.author?.date;

                    return (
                      <li key={c.sha} className="compare-commit-item">
                        <div className="compare-commit-avatar-wrap">
                          {authorAvatar ? (
                            <img src={authorAvatar} alt={authorName} className="author-avatar-img" />
                          ) : (
                            <span className="author-avatar-fallback">
                              {authorName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="compare-commit-main">
                          <div className="compare-commit-msg-row">
                            <span className="compare-commit-msg" title={commitMsg}>
                              {commitMsg}
                            </span>
                          </div>

                          <div className="compare-commit-meta-row">
                            <span className="compare-commit-author">{authorName}</span>
                            {dateStr && (
                              <span className="compare-commit-time" title={formatDetailDate(dateStr).full}>
                                <Clock size={10} />
                                {formatDetailDate(dateStr).relative}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="compare-commit-actions">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.sha, c.sha)}
                            className="commit-sha-micro-btn"
                            title="Copy full SHA"
                          >
                            <code>{c.sha.slice(0, 7)}</code>
                            {copiedSha === c.sha ? (
                              <Check size={10} className="text-emerald" />
                            ) : (
                              <Copy size={10} />
                            )}
                          </button>

                          {onInspectCommit && (
                            <button
                              type="button"
                              onClick={() => onInspectCommit(c.sha)}
                              className="commit-inspect-micro-btn"
                              title="Inspect this commit detail"
                            >
                              Inspect
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* CHANGED FILES TAB CONTENT */}
          {activeTab === 'files' && (
            <div className="commit-inspect-card files-card">
              <div className="files-header-row">
                <span className="commit-card-subtitle">
                  <FileText size={11} /> Changed Files ({files.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="view-code-action-btn"
                  title="Open full code diff window"
                >
                  <FileCode size={11} />
                  <span>Show Code</span>
                </button>
              </div>

              {files.length === 0 ? (
                <div className="diff-empty-state">
                  <p>No changed files between <code>{base}</code> and <code>{head}</code>.</p>
                </div>
              ) : (
                <ul className="inspect-files-list">
                  {files.map((file, idx) => {
                    const statusName = file.status || 'modified';
                    return (
                      <li key={`${file.filename}-${idx}`} className="inspect-file-item">
                        <div className="inspect-file-left">
                          <span className={`file-status-badge status-${statusName}`}>
                            {statusName}
                          </span>
                          <span className="file-name-text" title={file.filename}>
                            {file.filename}
                          </span>
                          {file.previous_filename && (
                            <span
                              className="file-previous-name"
                              title={`Renamed from ${file.previous_filename}`}
                            >
                              ← {file.previous_filename}
                            </span>
                          )}
                        </div>

                        <div className="inspect-file-right">
                          {file.additions > 0 && (
                            <span className="file-additions-tag">+{file.additions}</span>
                          )}
                          {file.deletions > 0 && (
                            <span className="file-deletions-tag">-{file.deletions}</span>
                          )}
                          {file.changes > 0 &&
                            file.additions === 0 &&
                            file.deletions === 0 && (
                              <span className="file-changes-tag">{file.changes} changes</span>
                            )}

                          <button
                            type="button"
                            onClick={() => setShowCodeModal(true)}
                            className="file-inspect-code-btn"
                            title={`Open code diff for ${file.filename}`}
                          >
                            <FileCode size={10} />
                            <span>Show Code</span>
                          </button>

                          {file.blob_url && (
                            <a
                              href={file.blob_url}
                              target="_blank"
                              rel="noreferrer"
                              className="file-ext-link-btn"
                              title={`Open ${file.filename} on GitHub`}
                            >
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Code Diff Window Modal Overlay (16:9 Frosted Glass in Portal) */}
      {showCodeModal && comparison && typeof document !== 'undefined' && createPortal(
        <div
          className="code-diff-modal-backdrop"
          onClick={() => setShowCodeModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Code diff comparison between ${base} and ${head}`}
        >
          <div
            className="code-diff-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="code-diff-modal-header">
              <div className="modal-header-left">
                <div className="modal-title-row">
                  <FileCode size={15} className="modal-header-icon" />
                  <span className="modal-header-title">Branch Comparison Diff</span>
                  <span className="modal-branch-tag">
                    <GitBranch size={10} />
                    {base} ... {head}
                  </span>
                  <span className="modal-sha-pill">
                    <FileText size={11} />
                    <span>{files.length} changed files</span>
                  </span>
                </div>
                <div className="modal-commit-message">
                  {comparison.status === 'ahead' && `Head (${head}) is ahead of base (${base}) by ${comparison.ahead_by} commit(s)`}
                  {comparison.status === 'behind' && `Head (${head}) is behind base (${base}) by ${comparison.behind_by} commit(s)`}
                  {comparison.status === 'identical' && `Base (${base}) and Head (${head}) are identical`}
                  {comparison.status === 'diverged' && `Base (${base}) and Head (${head}) have diverged (+${comparison.ahead_by} / -${comparison.behind_by})`}
                </div>
              </div>

              <div className="modal-header-right">
                {comparison.html_url && (
                  <a
                    href={comparison.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="modal-open-github-btn"
                    title="Open full comparison on GitHub in new tab"
                  >
                    <span>GitHub</span>
                    <ExternalLink size={11} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="modal-close-window-btn"
                  title="Close code diff window (Esc)"
                  aria-label="Close code window"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Modal Diff Body */}
            <div className="code-diff-modal-body">
              <DiffViewer files={files} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
