type StatsCardProps = { label: string; value: string; detail: string; icon: string };

export function StatsCard({ label, value, detail, icon }: StatsCardProps) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><strong>{value}</strong><small>{detail}</small></div>;
}
