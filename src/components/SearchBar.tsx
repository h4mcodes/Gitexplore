import { ArrowUpRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function SearchBar() {
  return (
    <motion.div
      className="search-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
    >
      <Search className="search-icon" size={20} />
      <input aria-label="GitHub username" placeholder="Search GitHub username..." />
      <button type="button">Explore <ArrowUpRight size={16} /></button>
    </motion.div>
  );
}
