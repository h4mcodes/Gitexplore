import { motion } from 'framer-motion';
import { ArrowDownRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { SearchBar } from '../components/SearchBar';

export function Home() {
  return (
    <main className="page-shell home-page">
      <div className="ambient ambient-blue" />
      <div className="ambient ambient-purple" />
      <div className="ambient ambient-green" />
      <Navbar showLabel={false} />
      <section className="hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="glass-badge">
            <span className="badge-pulse" />Explore GitHub developers <ArrowDownRight size={14} />
          </div>
          <h1>
            Understand the <span>&lt;code&gt;</span>
            <br />
            behind developers.
          </h1>
          <p>Explore the people, projects, and patterns shaping the open-source world.</p>
          <SearchBar />
          <div className="trust-note">
            <span className="trust-dot" />Built for curious minds <span className="note-divider" /> Private by design
          </div>
        </motion.div>
      </section>
      <footer>
        <span>GitExplore <b>·</b> Developer intelligence, made clear.</span>
      </footer>
    </main>
  );
}
