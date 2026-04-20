import { useState, useMemo } from 'react';

const COLS = [
  { key: 'date',     label: 'Date' },
  { key: 'robotId',  label: 'Robot' },
  { key: 'operator', label: 'Operator' },
  { key: 'project',  label: 'Project' },
  { key: 'marks',    label: 'Marks', right: true },
  { key: 'location', label: 'Location' },
  { key: 'notes',    label: 'Notes' },
];

export default function EntriesTable({ entries, onDelete }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [entries, sortKey, sortDir]);

  function sortBy(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'marks' || key === 'date' ? 'desc' : 'asc'); }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="font-medium">All entries</div>
        <div className="text-xs text-muted">{entries.length} rows</div>
      </div>
      <div className="overflow-x-auto">
        <table className="entries w-full">
          <thead>
            <tr>
              {COLS.map(c => (
                <th
                  key={c.key}
                  className={'cursor-pointer select-none ' + (c.right ? 'text-right' : '')}
                  onClick={() => sortBy(c.key)}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1 text-accent">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              {onDelete && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLS.length + (onDelete ? 1 : 0)} className="text-center text-muted py-8">No entries.</td></tr>
            )}
            {rows.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.robotId}</td>
                <td>{e.operator}</td>
                <td>{e.project}</td>
                <td className="text-right text-accent font-medium">{Number(e.marks).toLocaleString()}</td>
                <td className="text-muted">{e.location || '—'}</td>
                <td className="text-muted">{e.notes || '—'}</td>
                {onDelete && (
                  <td>
                    <button className="text-xs text-muted hover:text-red-400" onClick={() => onDelete(e.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
