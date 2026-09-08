import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Columns2,
  Copy,
  Check,
  FileCode,
  FileMinus,
  FilePlus,
  FileText,
  Filter,
  Layers,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type { GithubCommitFile } from '../types/github';

export interface DiffLine {
  type: 'addition' | 'deletion' | 'context' | 'hunk-header';
  text: string;
  oldLineNumber?: number | null;
  newLineNumber?: number | null;
}

export interface SplitDiffRow {
  left?: {
    type: 'deletion' | 'context' | 'hunk-header' | 'empty';
    text: string;
    lineNumber?: number | null;
  };
  right?: {
    type: 'addition' | 'context' | 'hunk-header' | 'empty';
    text: string;
    lineNumber?: number | null;
  };
  isHunkHeader?: boolean;
  hunkText?: string;
}

export function parseUnifiedPatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const rawLines = patch.split('\n');
  const lines: DiffLine[] = [];

  let currentOld = 1;
  let currentNew = 1;

  for (const raw of rawLines) {
    if (raw.startsWith('@@')) {
      const hunkMatch = raw.match(/@@\s*-(\d+)(?:,\d+)?\s*\+(\d+)(?:,\d+)?\s*@@(.*)/);
      if (hunkMatch) {
        currentOld = parseInt(hunkMatch[1], 10);
        currentNew = parseInt(hunkMatch[2], 10);
      }
      lines.push({
        type: 'hunk-header',
        text: raw,
      });
    } else if (raw.startsWith('+')) {
      lines.push({
        type: 'addition',
        text: raw.slice(1),
        oldLineNumber: null,
        newLineNumber: currentNew++,
      });
    } else if (raw.startsWith('-')) {
      lines.push({
        type: 'deletion',
        text: raw.slice(1),
        oldLineNumber: currentOld++,
        newLineNumber: null,
      });
    } else if (raw.startsWith('\\')) {
      lines.push({
        type: 'context',
        text: raw,
        oldLineNumber: null,
        newLineNumber: null,
      });
    } else {
      // Context line (leading space or unchanged line)
      const text = raw.startsWith(' ') ? raw.slice(1) : raw;
      lines.push({
        type: 'context',
        text,
        oldLineNumber: currentOld++,
        newLineNumber: currentNew++,
      });
    }
  }

  return lines;
}

export function buildSplitDiffRows(diffLines: DiffLine[]): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let i = 0;

  while (i < diffLines.length) {
    const line = diffLines[i];

    if (line.type === 'hunk-header') {
      rows.push({
        isHunkHeader: true,
        hunkText: line.text,
      });
      i++;
      continue;
    }

    if (line.type === 'context') {
      rows.push({
        left: {
          type: 'context',
          text: line.text,
          lineNumber: line.oldLineNumber,
        },
        right: {
          type: 'context',
          text: line.text,
          lineNumber: line.newLineNumber,
        },
      });
      i++;
      continue;
    }

    // Collect batch of consecutive deletions and additions
    const deletions: DiffLine[] = [];
    while (i < diffLines.length && diffLines[i].type === 'deletion') {
      deletions.push(diffLines[i]);
      i++;
    }

    const additions: DiffLine[] = [];
    while (i < diffLines.length && diffLines[i].type === 'addition') {
      additions.push(diffLines[i]);
      i++;
    }

    const maxCount = Math.max(deletions.length, additions.length);
    for (let idx = 0; idx < maxCount; idx++) {
      const del = deletions[idx];
      const add = additions[idx];

      rows.push({
        left: del
          ? {
              type: 'deletion',
              text: del.text,
              lineNumber: del.oldLineNumber,
            }
          : {
              type: 'empty',
              text: '',
              lineNumber: null,
            },
        right: add
          ? {
              type: 'addition',
              text: add.text,
              lineNumber: add.newLineNumber,
            }
          : {
              type: 'empty',
              text: '',
              lineNumber: null,
            },
      });
    }
  }

  return rows;
}

interface DiffViewerProps {
  files: GithubCommitFile[];
}

export function DiffViewer({ files }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(() => {
    // Expand first 5 files by default
    const initial: Record<string, boolean> = {};
    files.forEach((f, idx) => {
      initial[f.filename] = idx < 5;
    });
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const f of files) {
      if (f.status) set.add(f.status);
    }
    return Array.from(set).sort();
  }, [files]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return files.filter((f) => {
      const matchesSearch = !q || f.filename.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [files, searchQuery, statusFilter]);

  const toggleFile = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    files.forEach((f) => {
      next[f.filename] = true;
    });
    setExpandedFiles(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    files.forEach((f) => {
      next[f.filename] = false;
    });
    setExpandedFiles(next);
  };

  const copyFilePath = (filename: string) => {
    navigator.clipboard.writeText(filename).then(() => {
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 1800);
    }).catch(() => {
      // Fallback
    });
  };

  const totalAdditions = useMemo(() => files.reduce((acc, f) => acc + (f.additions || 0), 0), [files]);
  const totalDeletions = useMemo(() => files.reduce((acc, f) => acc + (f.deletions || 0), 0), [files]);

  return (
    <div className="diff-viewer-wrapper" aria-label="Commit Code Diff Investigation">
      {/* Diff Toolbar Controls */}
      <div className="diff-toolbar">
        <div className="diff-toolbar-left">
          <div className="diff-search-input-wrap">
            <Search size={12} className="diff-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter changed files..."
              className="diff-search-input"
              aria-label="Filter changed files by path"
            />
          </div>

          {statuses.length > 1 && (
            <div className="diff-status-filter">
              <Filter size={11} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter files by status"
              >
                <option value="all">All statuses ({files.length})</option>
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="diff-toolbar-right">
          {/* Unified / Split View Mode Switcher */}
          <div className="diff-view-switcher" role="group" aria-label="Diff view mode">
            <button
              type="button"
              className={`diff-switch-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
              title="Unified inline diff view"
            >
              <Code2 size={11} />
              <span>Unified</span>
            </button>
            <button
              type="button"
              className={`diff-switch-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Side-by-side split diff view"
            >
              <Columns2 size={11} />
              <span>Split</span>
            </button>
          </div>

          {/* Expand / Collapse All Controls */}
          <div className="diff-accordion-actions">
            <button
              type="button"
              onClick={expandAll}
              className="diff-expander-btn"
              title="Expand all file patches"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="diff-expander-btn"
              title="Collapse all file patches"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Files Summary Quick Bar */}
      <div className="diff-summary-bar">
        <span className="diff-summary-stat">
          <FileText size={12} />
          <strong>{filteredFiles.length}</strong> of {files.length} files
        </span>
        <span className="diff-summary-stat text-emerald">
          <FilePlus size={12} />
          <strong>+{totalAdditions.toLocaleString()}</strong> lines
        </span>
        <span className="diff-summary-stat text-rose">
          <FileMinus size={12} />
          <strong>-{totalDeletions.toLocaleString()}</strong> lines
        </span>
      </div>

      {/* Changed Files Diffs List */}
      {filteredFiles.length === 0 ? (
        <div className="diff-empty-state">
          <SlidersHorizontal size={18} />
          <p>No changed files matching the current filter.</p>
        </div>
      ) : (
        <div className="diff-files-container">
          {filteredFiles.map((file, fileIdx) => {
            const isExpanded = expandedFiles[file.filename] ?? false;
            const statusName = file.status || 'modified';
            const parsedLines = file.patch ? parseUnifiedPatch(file.patch) : [];
            const splitRows = file.patch && viewMode === 'split' ? buildSplitDiffRows(parsedLines) : [];

            return (
              <div
                key={`${file.filename}-${fileIdx}`}
                id={`diff-file-${fileIdx}`}
                className={`diff-file-card ${isExpanded ? 'is-open' : 'is-closed'}`}
              >
                {/* File Header Bar */}
                <div
                  className="diff-file-header"
                  onClick={() => toggleFile(file.filename)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFile(file.filename);
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-label={`Toggle patch for ${file.filename}`}
                >
                  <div className="diff-file-header-left">
                    <span className="diff-chevron-icon">
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </span>
                    <span className={`file-status-badge status-${statusName}`}>
                      {statusName}
                    </span>
                    <span className="diff-filename-text" title={file.filename}>
                      {file.filename}
                    </span>
                    {file.previous_filename && (
                      <span className="diff-renamed-text" title={`Renamed from ${file.previous_filename}`}>
                        ← {file.previous_filename}
                      </span>
                    )}
                  </div>

                  <div
                    className="diff-file-header-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="diff-file-metrics">
                      {file.additions > 0 && (
                        <span className="file-additions-tag">+{file.additions}</span>
                      )}
                      {file.deletions > 0 && (
                        <span className="file-deletions-tag">-{file.deletions}</span>
                      )}
                      {file.changes > 0 && file.additions === 0 && file.deletions === 0 && (
                        <span className="file-changes-tag">{file.changes} changes</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => copyFilePath(file.filename)}
                      className="diff-copy-path-btn"
                      title="Copy file path"
                      aria-label="Copy file path"
                    >
                      {copiedFile === file.filename ? (
                        <Check size={11} className="text-emerald" />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                </div>

                {/* File Diff Content */}
                {isExpanded && (
                  <div className="diff-content-body">
                    {!file.patch ? (
                      <div className="diff-no-patch-note">
                        <Layers size={13} />
                        <span>
                          {file.status === 'added' && file.changes === 0
                            ? 'Empty file added.'
                            : file.status === 'removed' && file.changes === 0
                            ? 'Empty file removed.'
                            : 'Binary file or large patch diff not directly rendered by GitHub REST API.'}
                        </span>
                      </div>
                    ) : viewMode === 'unified' ? (
                      /* UNIFIED INLINE DIFF VIEW */
                      <div className="diff-table-container">
                        <table className="diff-table unified-table">
                          <tbody>
                            {parsedLines.map((line, lineIdx) => {
                              if (line.type === 'hunk-header') {
                                return (
                                  <tr key={lineIdx} className="diff-row hunk-row">
                                    <td className="diff-gutter hunk-gutter" colSpan={2}>
                                      ...
                                    </td>
                                    <td className="diff-line-code hunk-code">
                                      <code>{line.text}</code>
                                    </td>
                                  </tr>
                                );
                              }

                              const isAdd = line.type === 'addition';
                              const isDel = line.type === 'deletion';

                              return (
                                <tr
                                  key={lineIdx}
                                  className={`diff-row ${isAdd ? 'row-add' : isDel ? 'row-del' : 'row-context'}`}
                                >
                                  <td className="diff-gutter old-gutter">
                                    {line.oldLineNumber != null ? line.oldLineNumber : ''}
                                  </td>
                                  <td className="diff-gutter new-gutter">
                                    {line.newLineNumber != null ? line.newLineNumber : ''}
                                  </td>
                                  <td className="diff-line-code">
                                    <span className="diff-marker">
                                      {isAdd ? '+' : isDel ? '-' : ' '}
                                    </span>
                                    <code className="diff-text">{line.text || ' '}</code>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* SPLIT SIDE-BY-SIDE DIFF VIEW */
                      <div className="diff-table-container split-scroll-container">
                        <table className="diff-table split-table">
                          <tbody>
                            {splitRows.map((row, rIdx) => {
                              if (row.isHunkHeader) {
                                return (
                                  <tr key={rIdx} className="diff-row hunk-row">
                                    <td className="diff-gutter hunk-gutter">...</td>
                                    <td className="diff-line-code hunk-code">
                                      <code>{row.hunkText}</code>
                                    </td>
                                    <td className="diff-gutter hunk-gutter">...</td>
                                    <td className="diff-line-code hunk-code">
                                      <code>{row.hunkText}</code>
                                    </td>
                                  </tr>
                                );
                              }

                              const left = row.left;
                              const right = row.right;

                              const isLeftDel = left?.type === 'deletion';
                              const isRightAdd = right?.type === 'addition';

                              return (
                                <tr key={rIdx} className="diff-row split-row">
                                  {/* Left Column (Old/Deletions) */}
                                  <td className={`diff-gutter old-gutter ${isLeftDel ? 'gutter-del' : ''}`}>
                                    {left?.lineNumber != null ? left.lineNumber : ''}
                                  </td>
                                  <td className={`diff-line-code split-left-code ${isLeftDel ? 'row-del' : left?.type === 'empty' ? 'row-empty' : 'row-context'}`}>
                                    {left && left.type !== 'empty' && (
                                      <>
                                        <span className="diff-marker">
                                          {isLeftDel ? '-' : ' '}
                                        </span>
                                        <code className="diff-text">{left.text || ' '}</code>
                                      </>
                                    )}
                                  </td>

                                  {/* Right Column (New/Additions) */}
                                  <td className={`diff-gutter new-gutter ${isRightAdd ? 'gutter-add' : ''}`}>
                                    {right?.lineNumber != null ? right.lineNumber : ''}
                                  </td>
                                  <td className={`diff-line-code split-right-code ${isRightAdd ? 'row-add' : right?.type === 'empty' ? 'row-empty' : 'row-context'}`}>
                                    {right && right.type !== 'empty' && (
                                      <>
                                        <span className="diff-marker">
                                          {isRightAdd ? '+' : ' '}
                                        </span>
                                        <code className="diff-text">{right.text || ' '}</code>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
