import { MapPin, Link2 } from 'lucide-react';

export function ProfileCard() {
  return <div className="profile-card preview-surface"><div className="avatar-placeholder">A</div><div className="profile-copy"><div className="loading-line name-line" /><div className="loading-line handle-line" /><div className="profile-meta"><span><MapPin size={13} /> San Francisco, CA</span><span><Link2 size={13} /> alexchen.dev</span></div></div><span className="preview-chip">Profile preview</span></div>;
}
