import { ArrowLeft, Building2, ExternalLink, FolderGit2, Link2, MapPin, RotateCw, Search, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { RepoCard } from '../components/RepoCard';
import { StatsCard } from '../components/StatsCard';
import { fetchGithubRepositories, fetchGithubUser, GithubApiError } from '../services/githubApi';
import type { GithubRepository, GithubUser } from '../types/github';

function formatJoinedDate(date: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(date));
}

function normaliseBlog(blog: string) {
  return blog.startsWith('http://') || blog.startsWith('https://') ? blog : `https://${blog}`;
}

function ProfileSkeleton() {
  return <div className="profile-content"><div className="profile-hero-card profile-skeleton"><div className="skeleton-avatar" /><div className="skeleton-copy"><div /><div /><div className="skeleton-bio" /></div></div><div className="profile-stats skeleton-stats"><div /><div /><div /></div></div>;
}

function RepositorySkeletons() {
  return <section className="repository-section" aria-label="Loading repositories"><div className="repository-section-heading"><div><span className="eyebrow">PUBLIC WORK</span><h2>Repositories</h2></div></div><div className="repository-grid repository-skeleton-grid">{Array.from({ length: 4 }, (_, index) => <div className="repository-skeleton" key={index}><span /><span /><span /><span /></div>)}</div></section>;
}

type RepositorySort = 'updated' | 'stars' | 'forks' | 'created' | 'name';
const REPOSITORIES_PER_PAGE = 12;

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<GithubUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [repositories, setRepositories] = useState<GithubRepository[]>([]);
  const [repositoryStatus, setRepositoryStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [repositoryQuery, setRepositoryQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [repositorySort, setRepositorySort] = useState<RepositorySort>('updated');
  const [visibleRepositoryCount, setVisibleRepositoryCount] = useState(REPOSITORIES_PER_PAGE);

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const r of repositories) {
      if (r.language) set.add(r.language);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [repositories]);

  const filteredRepositories = useMemo(() => {
    const query = repositoryQuery.trim().toLowerCase();
    let list = repositories;

    if (selectedLanguage !== 'all') {
      list = list.filter((r) => r.language === selectedLanguage);
    }

    if (query) {
      list = list.filter((r) => {
        return (
          r.name.toLowerCase().includes(query) ||
          r.full_name.toLowerCase().includes(query) ||
          (r.description && r.description.toLowerCase().includes(query)) ||
          (r.language && r.language.toLowerCase().includes(query))
        );
      });
    }

    if (repositorySort === 'stars') {
      return list.slice().sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    if (repositorySort === 'forks') {
      return list.slice().sort((a, b) => b.forks_count - a.forks_count);
    }
    if (repositorySort === 'created') {
      return list.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    if (repositorySort === 'name') {
      return list.slice().sort((a, b) => a.name.localeCompare(b.name));
    }
    return list.slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [repositories, repositoryQuery, repositorySort, selectedLanguage]);

  const visibleRepositories = filteredRepositories.slice(0, visibleRepositoryCount);
  const repositoryTotals = useMemo(() => {
    let stars = 0;
    let forks = 0;
    for (const r of repositories) {
      stars += r.stargazers_count;
      forks += r.forks_count;
    }
    return { stars, forks };
  }, [repositories]);

  const resetRepositoryFilters = () => {
    setRepositoryQuery('');
    setSelectedLanguage('all');
    setRepositorySort('updated');
    setVisibleRepositoryCount(REPOSITORIES_PER_PAGE);
  };

  const loadRepositories = (profileUsername: string) => {
    setRepositoryStatus('loading');
    fetchGithubRepositories(profileUsername).then((items) => {
      setRepositories(items);
      setRepositoryStatus('ready');
      setVisibleRepositoryCount(REPOSITORIES_PER_PAGE);
    }).catch(() => {
      setRepositories([]);
      setRepositoryStatus('error');
    });
  };

  useEffect(() => {
    if (!username) { setStatus('error'); return; }
    let active = true;
    setStatus('loading');
    setRepositoryStatus('loading');
    setRepositories([]);
    resetRepositoryFilters();
    fetchGithubUser(username).then((user) => {
      if (active) {
        setProfile(user);
        setStatus('ready');
        fetchGithubRepositories(user.login).then((items) => {
          if (active) {
            setRepositories(items);
            setRepositoryStatus('ready');
            setVisibleRepositoryCount(REPOSITORIES_PER_PAGE);
          }
        }).catch(() => {
          if (active) setRepositoryStatus('error');
        });
      }
    }).catch((error: unknown) => {
      if (!active) return;
      setProfile(null);
      setStatus(error instanceof GithubApiError && error.kind === 'not-found' ? 'not-found' : 'error');
    });
    return () => { active = false; };
  }, [username]);

  return <main className="page-shell profile-page"><div className="ambient ambient-blue" /><div className="ambient ambient-purple" /><div className="ambient ambient-green" /><Navbar /><div className="profile-content"><Link className="back-link" to="/"><ArrowLeft size={15} /> Back to search</Link>{status === 'loading' && <ProfileSkeleton />}{status !== 'loading' && status !== 'ready' && <motion.div className="profile-error" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><span className="error-mark">!</span><h1>{status === 'not-found' ? "We couldn't find that GitHub profile." : 'Something went wrong. Please try again.'}</h1><p>Check the username and try again.</p><div className="error-actions"><button type="button" onClick={() => navigate('/')}>Back to search</button><button type="button" className="secondary-action" onClick={() => navigate(0)}>Try again</button></div></motion.div>}{status === 'ready' && profile && <motion.div className="profile-content-inner" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: 'easeOut' }}><section className="profile-hero-card"><div className="profile-avatar-wrap"><img src={profile.avatar_url} alt={`${profile.login}'s GitHub avatar`} /></div><div className="profile-details"><span className="eyebrow">GITHUB PROFILE</span><h1>{profile.name || profile.login}</h1><p className="profile-handle">@{profile.login}</p>{profile.bio && <p className="profile-bio">{profile.bio}</p>}<div className="profile-meta-list">{profile.location && <span><MapPin size={15} />{profile.location}</span>}{profile.company && <span><Building2 size={15} />{profile.company}</span>}{profile.blog && <a href={normaliseBlog(profile.blog)} target="_blank" rel="noreferrer"><Link2 size={15} />{profile.blog}<ExternalLink size={12} /></a>}<span><Users size={15} />Joined {formatJoinedDate(profile.created_at)}</span></div></div><a className="github-profile-link" href={profile.html_url} target="_blank" rel="noreferrer" aria-label={`Open ${profile.login}'s GitHub profile`}>View on GitHub <ExternalLink size={13} /></a></section><section className="profile-stats"><StatsCard label="Repositories" value={profile.public_repos.toLocaleString()} detail="Public projects" icon="⌘" /><StatsCard label="Followers" value={profile.followers.toLocaleString()} detail="People following" icon="↗" /><StatsCard label="Following" value={profile.following.toLocaleString()} detail="Developer network" icon="◌" /></section>{repositoryStatus === 'loading' && <RepositorySkeletons />}{repositoryStatus === 'error' && <section className="repository-section repository-message"><FolderGit2 size={22} /><h2>We couldn't load repositories.</h2><p>Please try again.</p><button type="button" onClick={() => loadRepositories(profile.login)}><RotateCw size={14} />Retry</button></section>}{repositoryStatus === 'ready' && repositories.length === 0 && <section className="repository-section repository-message"><FolderGit2 size={22} /><h2>No public repositories yet.</h2><p>This developer has not shared any public projects.</p></section>}{repositoryStatus === 'ready' && repositories.length > 0 && <section className="repository-section"><div className="repository-section-heading"><div><span className="eyebrow">PUBLIC WORK</span><h2>Repositories</h2></div><span>{visibleRepositories.length.toLocaleString()} of {filteredRepositories.length.toLocaleString()} shown</span></div><section className="repository-summary" aria-label="Repository statistics"><StatsCard label="Repositories" value={repositories.length.toLocaleString()} detail="Loaded public projects" icon="⌘" /><StatsCard label="Total stars" value={repositoryTotals.stars.toLocaleString()} detail="Across loaded projects" icon="★" /><StatsCard label="Total forks" value={repositoryTotals.forks.toLocaleString()} detail="Across loaded projects" icon="⌘" /></section><div className="repository-toolbar"><label className="repository-search"><Search size={15} /><span className="sr-only">Search repositories</span><input value={repositoryQuery} onChange={(event) => { setRepositoryQuery(event.target.value); setVisibleRepositoryCount(REPOSITORIES_PER_PAGE); }} placeholder="Search repositories..." /></label><div className="repository-filter-controls"><select value={selectedLanguage} onChange={(event) => { setSelectedLanguage(event.target.value); setVisibleRepositoryCount(REPOSITORIES_PER_PAGE); }} aria-label="Filter repositories by language"><option value="all">All languages</option>{languages.map((language) => <option key={language} value={language}>{language}</option>)}</select><select value={repositorySort} onChange={(event) => { setRepositorySort(event.target.value as RepositorySort); setVisibleRepositoryCount(REPOSITORIES_PER_PAGE); }} aria-label="Sort repositories"><option value="updated">Recently updated</option><option value="stars">Most stars</option><option value="forks">Most forks</option><option value="created">Newest</option><option value="name">Name</option></select>{(repositoryQuery || selectedLanguage !== 'all' || repositorySort !== 'updated') && <button type="button" className="clear-repository-filters" onClick={resetRepositoryFilters}><X size={14} />Clear</button>}</div></div>{filteredRepositories.length > 0 ? <><div className="repository-grid">{visibleRepositories.map((repository, index) => <RepoCard key={repository.id} repository={repository} index={index} />)}</div>{visibleRepositories.length < filteredRepositories.length && <div className="repository-load-more"><button type="button" onClick={() => setVisibleRepositoryCount((count) => count + REPOSITORIES_PER_PAGE)}>Load more <span>{Math.min(REPOSITORIES_PER_PAGE, filteredRepositories.length - visibleRepositories.length)} remaining</span></button></div>}</> : <div className="repository-message repository-no-results"><FolderGit2 size={22} /><h2>No repositories found.</h2><p>Try another search or reset the filters.</p><button type="button" onClick={resetRepositoryFilters}><X size={14} />Clear filters</button></div>}</section>}</motion.div>}</div><footer><span>GitExplore <b>·</b> Developer intelligence, made clear.</span><span className="footer-mark">Real-time public profile</span></footer></main>;
}
