import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ExternalLink,
  Flame,
  GitCommit,
  GitFork,
  GitPullRequest,
  PlusCircle,
  RotateCw,
  Star,
  Zap,
} from 'lucide-react';
import { fetchGithubUserEvents, processUserActivity } from '../services/githubApi';
import type { DailyActivityItem, GithubEvent, ProcessedActivity } from '../types/github';

interface ContributionGraphProps {
  username?: string;
  className?: string;
}

type EventFilterCategory = 'all' | 'pushes' | 'prs' | 'issues' | 'creates' | 'stars';

function formatEventTime(dateString: string): string {
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
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return dateString;
  }
}

function formatDayTooltip(item: DailyActivityItem): string {
  try {
    const date = new Date(item.date);
    const dateFormatted = new Intl.DateTimeFormat('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
    if (item.count === 0) {
      return `No activity on ${dateFormatted}`;
    }
    const unit = item.count === 1 ? 'activity event' : 'activity events';
    return `${item.count} ${unit} on ${dateFormatted}`;
  } catch {
    return `${item.count} events on ${item.date}`;
  }
}

const fallbackColumns = Array.from({ length: 27 }, (_, column) =>
  Array.from({ length: 7 }, (_, row) => (column * 3 + row * 5) % 5)
);

export function ContributionGraph({ username, className = '' }: ContributionGraphProps) {
  // If no username is provided (e.g. landing page preview card), render the preview rhythm
  if (!username) {
    return (
      <div className={`activity preview-surface ${className}`}>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACTIVITY</span>
            <h3>Contribution rhythm</h3>
          </div>
          <span className="year-label">Last 12 months</span>
        </div>
        <div className="graph-wrap">
          <div className="day-labels">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div className="graph">
            <div className="month-labels">
              <span>Jan</span>
              <span>Mar</span>
              <span>May</span>
              <span>Jul</span>
              <span>Sep</span>
              <span>Nov</span>
            </div>
            <div className="graph-grid">
              {fallbackColumns.map((column, x) => (
                <div className="graph-column" key={x}>
                  {column.map((level, y) => (
                    <span className={`level-${level}`} key={y} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="graph-bottom">
          <span>Less</span>
          <i className="level-0" />
          <i className="level-1" />
          <i className="level-2" />
          <i className="level-3" />
          <i className="level-4" />
          <span>More</span>
        </div>
      </div>
    );
  }

  // Live profile activity mode
  const [data, setData] = useState<ProcessedActivity | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeFilter, setActiveFilter] = useState<EventFilterCategory>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DailyActivityItem | null>(null);
  const [showOlderEvents, setShowOlderEvents] = useState<boolean>(false);

  const loadActivity = () => {
    if (!username) return;
    setStatus('loading');
    fetchGithubUserEvents(username, 1, 100)
      .then((events) => {
        const processed = processUserActivity(events, 52);
        setData(processed);
        setStatus('ready');
      })
      .catch(() => {
        setData(null);
        setStatus('error');
      });
  };

  useEffect(() => {
    loadActivity();
  }, [username]);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    if (activeFilter === 'all') return data.events;
    if (activeFilter === 'pushes') return data.events.filter((e) => e.type === 'PushEvent');
    if (activeFilter === 'prs') return data.events.filter((e) => e.type === 'PullRequestEvent');
    if (activeFilter === 'issues')
      return data.events.filter((e) => e.type === 'IssuesEvent' || e.type === 'IssueCommentEvent');
    if (activeFilter === 'creates')
      return data.events.filter((e) => e.type === 'CreateEvent' || e.type === 'DeleteEvent');
    if (activeFilter === 'stars')
      return data.events.filter((e) => e.type === 'WatchEvent' || e.type === 'ForkEvent');
    return data.events;
  }, [data, activeFilter]);

  const topEvents = useMemo(() => filteredEvents.slice(0, 3), [filteredEvents]);
  const olderEvents = useMemo(() => filteredEvents.slice(3), [filteredEvents]);

  const renderEventCard = (event: GithubEvent) => {
    const isExpanded = expandedEventId === event.id;
    const repoName = event.repo?.name || 'Unknown repo';
    const repoUrl = `https://github.com/${repoName}`;

    return (
      <div key={event.id} className="activity-event-card">
        <div className="activity-event-icon-column">
          {event.type === 'PushEvent' && <GitCommit size={14} className="icon-push" />}
          {event.type === 'PullRequestEvent' && (
            <GitPullRequest size={14} className="icon-pr" />
          )}
          {(event.type === 'IssuesEvent' || event.type === 'IssueCommentEvent') && (
            <CircleDot size={14} className="icon-issue" />
          )}
          {event.type === 'CreateEvent' && (
            <PlusCircle size={14} className="icon-create" />
          )}
          {event.type === 'WatchEvent' && <Star size={14} className="icon-star" />}
          {event.type === 'ForkEvent' && <GitFork size={14} className="icon-fork" />}
          {![
            'PushEvent',
            'PullRequestEvent',
            'IssuesEvent',
            'IssueCommentEvent',
            'CreateEvent',
            'WatchEvent',
            'ForkEvent',
          ].includes(event.type) && <Activity size={14} className="icon-other" />}
        </div>

        <div className="activity-event-body">
          <div className="activity-event-main-line">
            <span className="activity-action-label">
              {event.type === 'PushEvent' && (
                <>
                  Pushed{' '}
                  <strong>
                    {event.payload.commits?.length || event.payload.size || 1}
                  </strong>{' '}
                  {event.payload.commits?.length === 1 ? 'commit' : 'commits'} to
                </>
              )}
              {event.type === 'PullRequestEvent' && (
                <>
                  {event.payload.action === 'opened'
                    ? 'Opened pull request in'
                    : event.payload.action === 'closed'
                    ? 'Closed pull request in'
                    : 'Updated pull request in'}
                </>
              )}
              {event.type === 'IssuesEvent' && (
                <>
                  {event.payload.action === 'opened' ? 'Opened issue in' : 'Updated issue in'}
                </>
              )}
              {event.type === 'IssueCommentEvent' && <>Commented on issue in</>}
              {event.type === 'CreateEvent' && (
                <>
                  Created {event.payload.ref_type || 'resource'}{' '}
                  {event.payload.ref ? `"${event.payload.ref}"` : ''} in
                </>
              )}
              {event.type === 'WatchEvent' && <>Starred repository</>}
              {event.type === 'ForkEvent' && <>Forked repository</>}
              {![
                'PushEvent',
                'PullRequestEvent',
                'IssuesEvent',
                'IssueCommentEvent',
                'CreateEvent',
                'WatchEvent',
                'ForkEvent',
              ].includes(event.type) && <>Activity in</>}
            </span>

            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="activity-repo-link"
              title={`View ${repoName} on GitHub`}
            >
              {repoName}
              <ExternalLink size={10} />
            </a>

            <span className="activity-time-tag">
              {formatEventTime(event.created_at)}
            </span>
          </div>

          {/* Event details: PR title, Issue title, or commits */}
          {event.type === 'PullRequestEvent' && event.payload.pull_request && (
            <div className="activity-detail-box">
              <a
                href={event.payload.pull_request.html_url}
                target="_blank"
                rel="noreferrer"
                className="activity-target-link"
              >
                #{event.payload.pull_request.number}: {event.payload.pull_request.title}
              </a>
            </div>
          )}

          {event.type === 'IssuesEvent' && event.payload.issue && (
            <div className="activity-detail-box">
              <a
                href={event.payload.issue.html_url}
                target="_blank"
                rel="noreferrer"
                className="activity-target-link"
              >
                #{event.payload.issue.number}: {event.payload.issue.title}
              </a>
            </div>
          )}

          {event.type === 'PushEvent' && event.payload.commits && event.payload.commits.length > 0 && (
            <div className="activity-commits-block">
              <div className="activity-commit-row">
                <code className="commit-sha-micro">
                  {event.payload.commits[0].sha.slice(0, 7)}
                </code>
                <span className="commit-msg-micro">
                  {event.payload.commits[0].message}
                </span>
              </div>

              {event.payload.commits.length > 1 && (
                <>
                  {isExpanded &&
                    event.payload.commits.slice(1).map((c, i) => (
                      <div key={i} className="activity-commit-row">
                        <code className="commit-sha-micro">{c.sha.slice(0, 7)}</code>
                        <span className="commit-msg-micro">{c.message}</span>
                      </div>
                    ))}

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEventId(isExpanded ? null : event.id)
                    }
                    className="activity-toggle-commits"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={11} /> Hide {event.payload.commits.length - 1} more commits
                      </>
                    ) : (
                      <>
                        <ChevronDown size={11} /> View {event.payload.commits.length - 1} more commits
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className={`contribution-section preview-surface ${className}`} aria-label="Contribution and Activity">
      {/* Section Header */}
      <div className="contribution-header">
        <div className="contribution-header-left">
          <div className="contribution-icon-pill">
            <Activity size={16} />
          </div>
          <div>
            <span className="eyebrow">RECENT ACTIVITY</span>
            <h2>Contributions & Rhythm</h2>
          </div>
        </div>

        {status === 'ready' && data && (
          <div className="contribution-header-stats">
            <div className="contrib-stat-item">
              <Zap size={12} className="text-emerald" />
              <span>
                <strong>{data.totalRecentContributions}</strong> recent events
              </span>
            </div>
            {data.stats.totalCommits > 0 && (
              <div className="contrib-stat-item">
                <GitCommit size={12} className="text-blue" />
                <span>
                  <strong>{data.stats.totalCommits}</strong> commits
                </span>
              </div>
            )}
            {data.mostActiveDay && (
              <div className="contrib-stat-item">
                <Flame size={12} className="text-orange" />
                <span>
                  Peak: <strong>{data.mostActiveDay.count}</strong>/day
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {status === 'loading' && (
        <div className="contribution-skeleton-wrap" aria-label="Loading activity feed">
          <div className="activity-matrix-skeleton shimmer-bg" />
          <div className="activity-filter-skeleton shimmer-bg" />
          <div className="activity-item-skeleton shimmer-bg" />
          <div className="activity-item-skeleton shimmer-bg" />
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="contribution-error-box">
          <p>Failed to load activity stream for @{username}.</p>
          <button type="button" onClick={loadActivity} className="contribution-retry-btn">
            <RotateCw size={13} /> Retry Activity
          </button>
        </div>
      )}

      {/* Ready State */}
      {status === 'ready' && data && (
        <>
          {/* Contribution Rhythm Grid / Heatmap */}
          <div className="activity-matrix-card">
            <div className="activity-matrix-top">
              <span className="activity-matrix-title">
                <Calendar size={13} />
                Activity Rhythm (52 Weeks)
              </span>
              <div className="activity-matrix-legend">
                <span>Less</span>
                <i className="level-0" title="0 events" />
                <i className="level-1" title="1-2 events" />
                <i className="level-2" title="3-4 events" />
                <i className="level-3" title="5-7 events" />
                <i className="level-4" title="8+ events" />
                <span>More</span>
              </div>
            </div>

            <div className="graph-wrap matrix-scroll">
              <div className="day-labels-grid" aria-hidden="true">
                <span className="day-label-blank" />
                <span className="day-label-text">Mon</span>
                <span className="day-label-blank" />
                <span className="day-label-text">Wed</span>
                <span className="day-label-blank" />
                <span className="day-label-text">Fri</span>
                <span className="day-label-blank" />
              </div>
              <div className="graph-matrix-container">
                <div className="month-sections-track">
                  {data.monthSections.map((section, sIdx) => (
                    <Fragment key={`${section.year}-${section.monthName}-${sIdx}`}>
                      {sIdx > 0 && <div className="month-section-divider" aria-hidden="true" />}
                      <div className="month-section-block" style={{ flex: section.columns.length }}>
                        <span className="month-section-title">{section.monthName}</span>
                        <div className="month-section-grid">
                          {section.columns.map((column, cIdx) => (
                            <div className="graph-column" key={cIdx}>
                              {column.map((item, rIdx) =>
                                item ? (
                                  <span
                                    key={rIdx}
                                    className={`level-${item.level} ${
                                      hoveredDay?.date === item.date ? 'is-highlighted' : ''
                                    }`}
                                    onMouseEnter={() => setHoveredDay(item)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    title={formatDayTooltip(item)}
                                    aria-label={formatDayTooltip(item)}
                                  />
                                ) : (
                                  <span key={rIdx} className="level-empty" aria-hidden="true" />
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Hovered Day Status Bar */}
            <div className="matrix-tooltip-bar">
              {hoveredDay ? (
                <span className="matrix-tooltip-text">{formatDayTooltip(hoveredDay)}</span>
              ) : (
                <span className="matrix-tooltip-hint">Hover over cells to inspect daily contributions</span>
              )}
            </div>
          </div>

          {/* Activity Category Filters */}
          <div className="activity-filter-bar">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`activity-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            >
              All Events ({data.events.length})
            </button>
            {data.stats.pushEvents > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('pushes')}
                className={`activity-filter-pill ${activeFilter === 'pushes' ? 'active' : ''}`}
              >
                <GitCommit size={12} /> Pushes ({data.stats.pushEvents})
              </button>
            )}
            {data.stats.pullRequestEvents > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('prs')}
                className={`activity-filter-pill ${activeFilter === 'prs' ? 'active' : ''}`}
              >
                <GitPullRequest size={12} /> Pull Requests ({data.stats.pullRequestEvents})
              </button>
            )}
            {data.stats.issueEvents > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('issues')}
                className={`activity-filter-pill ${activeFilter === 'issues' ? 'active' : ''}`}
              >
                <CircleDot size={12} /> Issues ({data.stats.issueEvents})
              </button>
            )}
            {data.stats.createEvents > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('creates')}
                className={`activity-filter-pill ${activeFilter === 'creates' ? 'active' : ''}`}
              >
                <PlusCircle size={12} /> Created ({data.stats.createEvents})
              </button>
            )}
            {(data.stats.watchEvents > 0 || data.stats.forkEvents > 0) && (
              <button
                type="button"
                onClick={() => setActiveFilter('stars')}
                className={`activity-filter-pill ${activeFilter === 'stars' ? 'active' : ''}`}
              >
                <Star size={12} /> Starred & Forked ({data.stats.watchEvents + data.stats.forkEvents})
              </button>
            )}
          </div>

          {/* Activity Stream Feed */}
          {filteredEvents.length === 0 ? (
            <div className="activity-empty-feed">
              <p>No activity found for category "{activeFilter}".</p>
            </div>
          ) : (
            <div className="activity-feed-list">
              {/* Top 3 Latest Events */}
              {topEvents.map(renderEventCard)}

              {/* Older Events rendered directly in sequence when expanded */}
              {showOlderEvents && olderEvents.length > 0 && (
                <div className="activity-older-events-list">
                  {olderEvents.map(renderEventCard)}
                </div>
              )}

              {/* Collapsible Dropdown Toggle Button at the bottom */}
              {olderEvents.length > 0 && (
                <div className="activity-older-events-container">
                  <button
                    type="button"
                    onClick={() => setShowOlderEvents((prev) => !prev)}
                    className={`activity-older-events-toggle ${showOlderEvents ? 'is-active' : ''}`}
                    aria-expanded={showOlderEvents}
                  >
                    <span>
                      {showOlderEvents
                        ? 'Hide older activity'
                        : `Show older activity (${olderEvents.length} more events)`}
                    </span>
                    {showOlderEvents ? (
                      <ChevronUp size={13} className="older-toggle-chevron" />
                    ) : (
                      <ChevronDown size={13} className="older-toggle-chevron" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
