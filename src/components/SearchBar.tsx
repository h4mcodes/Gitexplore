import { ArrowUpRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export function SearchBar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter a GitHub username.');
      return;
    }
    setError('');
    navigate(`/profile/${encodeURIComponent(trimmedUsername)}`);
  }

  return (
    <motion.form
      className={`search-card${error ? ' has-error' : ''}`}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
    >
      <Search className="search-icon" size={20} />
      <input aria-label="GitHub username" value={username} onChange={(event) => { setUsername(event.target.value); if (error) setError(''); }} placeholder="Search GitHub username..." />
      <button type="submit">Explore <ArrowUpRight size={16} /></button>
      {error && <span className="search-error" role="alert">{error}</span>}
    </motion.form>
  );
}
