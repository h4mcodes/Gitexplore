import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  FilePlus,
  FileMinus,
  FileText,
  FolderGit2,
  GitBranch,
  GitCommit,
  GitMerge,
  RotateCw,
  User,
  X,
} from 'lucide-react';
import { fetchGithubCommitDetail } from '../services/githubApi';
import type { GithubCommitDetail, CommitRelationshipGraph } from '../types/github';
import { DiffViewer } from './DiffViewer';

interface CommitInspectionProps {
  owner: string;
  repo: string;
  sha: string;
  branch: string;
  fullName: string;
  commitGraph?: CommitRelationshipGraph;
  onBack: () => void;
  onSelectSha: (sha: string) => void;
  onClose?: () => void;
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

export function CommitInspection({
  owner,
  repo,
  sha,
  branch,
  fullName,
  commitGraph,
  onBack,
  onSelectSha,
  onClose,
}: CommitInspectionProps) {
  const [detail, setDetail] = useState<GithubCommitDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [copiedSha, setCopiedSha] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const loadCommitDetail = (targetSha: string) => {
    setStatus('loading');
    fetchGithubCommitDetail(owner, repo, targetSha)
      .then((data) => {
        setDetail(data);
        setStatus('ready');
      })
      .catch(() => {
        setDetail(null);
        setStatus('error');
      });
  };

  useEffect(() => {
    loadCommitDetail(sha);
    setShowCodeModal(false);
  }, [owner, repo, sha]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCodeModal) {
        setShowCodeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCodeModal]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }).catch(() => {
      // Fallback
    });
  };

  const graphNode = commitGraph?.nodes[sha];
  const parentShas = detail
    ? detail.parents.map((p) => p.sha)
    : graphNode?.parentShas || [];
  const childShas = graphNode?.childShas || [];

  const isMerge = parentShas.length > 1;
  const isRoot = parentShas.length === 0 && status === 'ready';

  // Extract commit title and body
  const messageLines = detail?.commit.message.split('\n') || ['Loading commit...'];
  const commitTitle = messageLines[0] || '';
  const commitBody = messageLines.slice(1).join('\n').trim();

  const authorName = detail?.author?.login || detail?.commit.author?.name || 'Unknown Author';
  const authorAvatar = detail?.author?.avatar_url;
  const authorDate = detail?.commit.author?.date;
  const authorEmail = detail?.commit.author?.email;

  const committerName = detail?.committer?.login || detail?.commit.committer?.name;
  const committerAvatar = detail?.committer?.avatar_url;
  const isDifferentCommitter = committerName && committerName !== authorName;

  const stats = detail?.stats || {
    total: 0,
    additions: 0,
    deletions: 0,
  };

  const files = detail?.files || [];

  return (
    <div className="commit-inspect-panel" aria-label={`Investigation of commit ${sha.slice(0, 7)}`}>
      {/* Top Navigation Bar */}
      <div className="commit-inspect-header">
        <div className="commit-inspect-nav-left">
          <button
            type="button"
            onClick={onBack}
            className="commit-inspect-back-btn"
            title="Back to commit history"
            aria-label="Back to commit list"
          >
            <ArrowLeft size={13} />
            <span>Commits</span>
          </button>

          <span className="commit-inspect-divider">/</span>

          <div className="commit-inspect-context">
            <span className="commit-inspect-repo-label" title={fullName}>
              <FolderGit2 size={12} />
              <span>{repo}</span>
            </span>
            <span className="commit-inspect-branch-tag">
              <GitBranch size={10} />
              <span>{branch}</span>
            </span>
          </div>
        </div>

        <div className="commit-inspect-nav-right">
          {files.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCodeModal(true)}
              className="show-code-nav-btn"
              title="Open full code diff in window"
            >
              <FileCode size={12} />
              <span>Show Code ({files.length})</span>
            </button>
          )}

          {detail?.html_url && (
            <a
              href={detail.html_url}
              target="_blank"
              rel="noreferrer"
              className="commit-inspect-github-link"
              title="Open commit on GitHub"
            >
              <span>GitHub</span>
              <ExternalLink size={11} />
            </a>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="commit-close-btn"
              aria-label="Close commit investigation"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="commit-inspect-skeleton" aria-label="Loading commit details">
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

      {status === 'error' && (
        <div className="commit-error-box">
          <p>Failed to retrieve detailed information for commit <code>{sha.slice(0, 7)}</code>.</p>
          <button
            type="button"
            onClick={() => loadCommitDetail(sha)}
            className="commit-retry-btn"
          >
            <RotateCw size={12} /> Retry Investigation
          </button>
        </div>
      )}

      {status === 'ready' && detail && (
        <div className="commit-inspect-body">
          {/* Commit Message Box */}
          <div className="commit-inspect-card message-card">
            <div className="commit-inspect-title-row">
              <div className="commit-inspect-type-badge-group">
                {isMerge && (
                  <span className="commit-type-tag merge-tag" title="Merge commit having multiple parents">
                    <GitMerge size={10} /> MERGE
                  </span>
                )}
                {isRoot && (
                  <span className="commit-type-tag root-tag" title="Initial commit with no parent">
                    INITIAL
                  </span>
                )}
                {!isMerge && !isRoot && (
                  <span className="commit-type-tag normal-tag" title="Standard single parent commit">
                    <GitCommit size={10} /> COMMIT
                  </span>
                )}
              </div>
              <h3 className="commit-inspect-title">{commitTitle}</h3>
            </div>

            {commitBody && (
              <div className="commit-inspect-body-text">
                <pre>{commitBody}</pre>
              </div>
            )}

            <div className="commit-inspect-sha-row">
              <span className="commit-inspect-sha-label">Commit SHA:</span>
              <div className="commit-sha-full-group">
                <code className="commit-sha-full-text">{detail.sha}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(detail.sha)}
                  className="commit-copy-sha-btn"
                  title="Copy full SHA"
                  aria-label="Copy full commit SHA"
                >
                  {copiedSha ? <Check size={11} className="text-emerald" /> : <Copy size={11} />}
                  <span>{copiedSha ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Author & Lineage Context Card */}
          <div className="commit-inspect-grid">
            {/* Author details */}
            <div className="commit-inspect-card author-card">
              <span className="commit-card-subtitle">
                <User size={11} /> Author & Committer
              </span>
              <div className="author-card-content">
                <div className="author-main-row">
                  <div className="author-avatar-wrap">
                    {authorAvatar ? (
                      <img src={authorAvatar} alt={authorName} className="author-avatar-img" />
                    ) : (
                      <span className="author-avatar-fallback">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="author-text-meta">
                    <div className="author-name-handle">
                      <strong>{authorName}</strong>
                      {detail.author?.login && detail.commit.author?.name && (
                        <span className="author-login">({detail.commit.author.name})</span>
                      )}
                    </div>
                    {authorEmail && (
                      <span className="author-email-text">{authorEmail}</span>
                    )}
                  </div>
                </div>

                {authorDate && (
                  <div className="author-timestamp-row">
                    <Clock size={11} />
                    <span
                      className="author-time-rel"
                      title={formatDetailDate(authorDate).full}
                    >
                      Authored {formatDetailDate(authorDate).relative}
                    </span>
                  </div>
                )}

                {isDifferentCommitter && (
                  <div className="committer-row">
                    <span className="committer-label">Committed by:</span>
                    <div className="committer-avatar-mini">
                      {committerAvatar ? (
                        <img src={committerAvatar} alt={committerName} />
                      ) : (
                        <span>{committerName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="committer-name">{committerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lineage (Parents & Children) */}
            <div className="commit-inspect-card lineage-card">
              <span className="commit-card-subtitle">
                <GitCommit size={11} /> Commit Lineage (DAG)
              </span>
              <div className="lineage-inspect-content">
                <div className="lineage-item-group">
                  <span className="lineage-role-label">Parents ({parentShas.length}):</span>
                  {parentShas.length === 0 ? (
                    <span className="lineage-none-text">Initial root commit (0 parents)</span>
                  ) : (
                    <div className="lineage-pill-list">
                      {parentShas.map((pSha) => (
                        <button
                          type="button"
                          key={pSha}
                          onClick={() => onSelectSha(pSha)}
                          className="lineage-target-btn"
                          title={`Inspect parent commit ${pSha}`}
                        >
                          <GitCommit size={10} />
                          <code>{pSha.slice(0, 7)}</code>
                          <span className="inspect-jump-badge">Inspect</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {childShas.length > 0 && (
                  <div className="lineage-item-group">
                    <span className="lineage-role-label">Children in branch ({childShas.length}):</span>
                    <div className="lineage-pill-list">
                      {childShas.map((cSha) => (
                        <button
                          type="button"
                          key={cSha}
                          onClick={() => onSelectSha(cSha)}
                          className="lineage-target-btn child-btn"
                          title={`Inspect child commit ${cSha}`}
                        >
                          <GitCommit size={10} />
                          <code>{cSha.slice(0, 7)}</code>
                          <span className="inspect-jump-badge">Inspect</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Investigation Change Stats Overview */}
          <div className="commit-inspect-card stats-card">
            <div className="stats-header-row">
              <span className="commit-card-subtitle">
                <FileCode size={11} /> Impact & Changes Overview
              </span>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="show-code-primary-btn"
                  title="Open code diff window"
                >
                  <FileCode size={12} />
                  <span>Show Code ({files.length})</span>
                </button>
              )}
            </div>

            <div className="commit-inspect-metrics-row">
              <div className="inspect-metric-pill">
                <FileText size={12} className="metric-icon" />
                <span className="metric-val">{files.length}</span>
                <span className="metric-lbl">{files.length === 1 ? 'file changed' : 'files changed'}</span>
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

              <div className="inspect-metric-pill text-delta">
                <span className="metric-val">
                  {stats.additions - stats.deletions >= 0 ? `+${(stats.additions - stats.deletions).toLocaleString()}` : (stats.additions - stats.deletions).toLocaleString()}
                </span>
                <span className="metric-lbl">net lines</span>
              </div>
            </div>
          </div>

          {/* Changed Files Overview List */}
          {files.length > 0 && (
            <div className="commit-inspect-card files-card">
              <div className="files-header-row">
                <span className="commit-card-subtitle">
                  <FileText size={11} /> Changed Files ({files.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="view-code-action-btn"
                  title="Open code diff window"
                >
                  <FileCode size={11} />
                  <span>Show Code</span>
                </button>
              </div>

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
                          <span className="file-previous-name" title={`Renamed from ${file.previous_filename}`}>
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
                        {file.changes > 0 && file.additions === 0 && file.deletions === 0 && (
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
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Code Diff Window Modal Overlay (Rendered in Portal) */}
      {showCodeModal && detail && typeof document !== 'undefined' && createPortal(
        <div
          className="code-diff-modal-backdrop"
          onClick={() => setShowCodeModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Code diff for commit ${sha.slice(0, 7)}`}
        >
          <div
            className="code-diff-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Window Header */}
            <div className="code-diff-modal-header">
              <div className="modal-header-left">
                <div className="modal-title-row">
                  <FileCode size={15} className="modal-header-icon" />
                  <span className="modal-header-title">Code Diff Investigation</span>
                  <span className="modal-sha-pill">
                    <GitCommit size={11} />
                    <code>{detail.sha.slice(0, 7)}</code>
                  </span>
                  <span className="modal-branch-tag">
                    <GitBranch size={10} />
                    {branch}
                  </span>
                </div>
                <div className="modal-commit-message" title={commitTitle}>
                  {commitTitle}
                </div>
              </div>

              <div className="modal-header-right">
                {detail.html_url && (
                  <a
                    href={detail.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="modal-open-github-btn"
                    title="Open full commit on GitHub in new tab"
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

            {/* Modal Window Diff Body */}
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
