import { useEffect, useRef, useState } from 'react';
import { DATE_PRESETS, presetRange, uniqueValues } from '../lib/filters.js';

function PillMenu({ open, options, selected, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="absolute top-full mt-1 left-0 z-20 menu max-h-64 overflow-y-auto">
      {options.length === 0 && <div className="menu-item" style={{ color: '#525252' }}>No options available</div>}
      {options.map(opt => (
        <div key={opt} className={'menu-item ' + (opt === selected ? 'selected' : '')} onClick={() => { onSelect(opt); onClose(); }}>
          {opt}
        </div>
      ))}
    </div>
  );
}

function FilterPill({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const active = !!value;
  return (
    <div className="relative">
      <button
        className={'pill ' + (active ? 'active' : '')}
        onClick={() => setOpen(o => !o)}
      >
        <span className="pill-label">{label}</span>
        {active ? (
          <>
            <span className="pill-value">{value}</span>
            <span
              className="pill-x"
              role="button"
              aria-label={`Clear ${label}`}
              onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
            >×</span>
          </>
        ) : (
          <span className="chev">▾</span>
        )}
      </button>
      <PillMenu
        open={open}
        options={options}
        selected={value}
        onSelect={v => onChange(v)}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

export default function FilterBar({ entries, filters, onChange, onRefresh, loading, statusText }) {
  const projects  = uniqueValues(entries, 'project');
  const operators = uniqueValues(entries, 'operator');
  const robots    = uniqueValues(entries, 'robotId');

  const activeCount = ['project', 'operator', 'robotId', 'search']
    .reduce((n, k) => n + (filters[k] ? 1 : 0), 0);

  function setPreset(preset) {
    const { from, to } = presetRange(preset);
    onChange({ ...filters, preset, from, to });
  }

  function setCustom(from, to) {
    onChange({ ...filters, preset: 'custom', from, to });
  }

  const presets = [
    ['today', 'Today'],
    ['7d', '7 days'],
    ['30d', '30 days'],
    ['quarter', 'Quarter'],
    ['custom', 'Custom…'],
  ];

  return (
    <section className="space-y-3">
      {/* Row 1: presets + search + refresh */}
      <div className="card p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="segmented" role="tablist">
          {presets.map(([key, label]) => (
            <button key={key} className={'seg ' + (filters.preset === key ? 'active' : '')} onClick={() => setPreset(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {filters.preset === 'custom' && (
            <>
              <input type="date" value={filters.from || ''} onChange={e => setCustom(e.target.value, filters.to)} className="input-dark" />
              <span className="text-muted text-xs">to</span>
              <input type="date" value={filters.to || ''} onChange={e => setCustom(filters.from, e.target.value)} className="input-dark" />
            </>
          )}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              className="input-dark pl-8 w-60"
              placeholder="Search entries…"
              value={filters.search || ''}
              onChange={e => onChange({ ...filters, search: e.target.value })}
            />
          </div>
          <button
            className="w-9 h-9 grid place-items-center border border-border rounded-md text-muted hover:text-accent hover:border-accent disabled:opacity-40"
            title="Refresh from Sheet"
            onClick={onRefresh}
            disabled={loading}
          >
            <svg className={loading ? 'animate-spin' : ''} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>
          </button>
        </div>
      </div>

      {/* Row 2: pills */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <span className="text-xs uppercase text-muted" style={{ letterSpacing: '0.12em' }}>Filter by</span>
        <span className="w-px h-5 bg-border mx-1" />
        <FilterPill label="Project"  value={filters.project  || ''} onChange={v => onChange({ ...filters, project: v })}  options={projects} />
        <FilterPill label="Operator" value={filters.operator || ''} onChange={v => onChange({ ...filters, operator: v })} options={operators} />
        <FilterPill label="Robot"    value={filters.robotId  || ''} onChange={v => onChange({ ...filters, robotId: v })}  options={robots} />

        <div className="ml-auto flex items-center gap-3">
          {activeCount > 0 && <span className="count-chip">{activeCount} FILTER{activeCount > 1 ? 'S' : ''} ACTIVE</span>}
          {activeCount > 0 && (
            <button
              className="text-xs text-muted underline underline-offset-2 hover:text-accent"
              onClick={() => onChange({ ...filters, project: '', operator: '', robotId: '', search: '' })}
            >Reset all</button>
          )}
        </div>
      </div>

      {/* Row 3: status */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted">{statusText}</span>
        <span className="text-xs text-muted">Filters apply instantly</span>
      </div>
    </section>
  );
}
