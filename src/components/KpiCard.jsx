export default function KpiCard({ label, value, sub, loading }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      {loading ? (
        <div className="skeleton h-8 w-24 mt-2" />
      ) : (
        <div className="text-3xl font-semibold mt-1 text-accent tabular-nums">{value}</div>
      )}
      {sub && <div className="text-xs mt-1 text-muted">{sub}</div>}
    </div>
  );
}
