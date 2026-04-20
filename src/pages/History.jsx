import { useEffect, useState } from 'react';
import { useEntries } from '../store/useEntries.js';
import EntriesTable from '../components/EntriesTable.jsx';

export default function History() {
  const { entries, loading, error, refresh, deleteEntry } = useEntries();
  const [confirming, setConfirming] = useState(null);

  useEffect(() => { refresh(); }, [refresh]);

  async function onDelete(id) {
    if (confirming !== id) { setConfirming(id); return; }
    setConfirming(null);
    await deleteEntry(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">History</h1>
          <p className="text-xs text-muted">All entries in the Sheet. Click Delete once to arm, again to confirm.</p>
        </div>
        <button className="btn-ghost text-sm px-3 py-1.5 rounded-md" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 text-sm text-red-300">{error}</div>
      )}
      <EntriesTable
        entries={entries}
        onDelete={id => onDelete(id)}
      />
      {confirming && (
        <div className="text-xs text-amber-300">Click Delete again on the same row to confirm removal.</div>
      )}
    </div>
  );
}
