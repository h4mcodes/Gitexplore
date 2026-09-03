import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <motion.header
      className="nav-shell"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    >
      <div className="brand-mark" aria-label="GitHub"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.39v-1.51c-2.24.49-2.71-1.08-2.71-1.08-.36-.93-.87-1.18-.87-1.18-.71-.49.05-.48.05-.48.78.06 1.19.8 1.19.8.7 1.19 1.84.85 2.29.65.07-.51.27-.85.5-1.05-1.79-.2-3.67-.9-3.67-4A3.14 3.14 0 0 1 3.64 5.2c-.08-.2-.35-1 .08-2.07 0 0 .67-.21 2.2.8A7.63 7.63 0 0 1 8 3.64a7.7 7.7 0 0 1 2.08.29c1.53-1.01 2.2-.8 2.2-.8.43 1.07.16 1.87.08 2.07a3.14 3.14 0 0 1 .84 2.18c0 3.11-1.89 3.8-3.69 4 .28.24.53.72.53 1.45v2.17c0 .22.14.46.55.38A8 8 0 0 0 8 0Z" /></svg></div>
      <span className="brand-name">Git<span>Explore</span></span>
      <span className="product-label">GitHub Developer Intelligence</span>
    </motion.header>
  );
}
