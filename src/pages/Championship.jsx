import { useEffect, useMemo, useState } from 'react';
import { useEntries } from '../store/useEntries.js';
import { computeChampionship, CHAMPIONSHIP_START } from '../lib/championship.js';

// ---------------- helpers ----------------

function formatNumber(n) {
  return (n ?? 0).toLocaleString();
}

function uniqueProjects(entries) {
  const s = new Set();
  for (const e of entries || []) if (e.project) s.add(e.project);
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function marginLabel(row) {
  if (row.margin == null) return 'uncontested';
  if (row.margin <= 200) return `lead by ${formatNumber(row.margin)} · nail-biter`;
  return `lead by ${formatNumber(row.margin)}`;
}

// ---------------- sub-components ----------------

function PageHeader() {
  return (
    <header className="mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Season</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-[#0c0c0c] text-muted">
          started Apr 17, 2026
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Operator <span className="text-accent" style={{ textShadow: '0 0 20px rgba(245, 197, 24, 0.45)' }}>Championship</span>
      </h1>
      <p className="text-sm text-muted mt-2 max-w-2xl">
        Who's racking up the most marks on each project? Leader and runner-up per site, recalculated live from every parsed report. Filter by project to zoom in on one race.
      </p>
    </header>
  );
}

function ProjectFilterBar({ projects, value, onChange }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted uppercase tracking-[0.18em] mr-2">Project</span>
        <button
          className={`pill ${!value ? 'active' : ''}`}
          onClick={() => onChange('')}
        >
          <span className="pill-label">All projects</span>
          <span className="count-chip ml-1">{projects.length}</span>
        </button>
        {projects.map(p => (
          <button
            key={p}
            className={`pill ${value === p ? 'active' : ''}`}
            onClick={() => onChange(p)}
          >
            <span className="pill-label">{p}</span>
            {value === p && (
              <button
                className="pill-x ml-1"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}
                aria-label={`Clear ${p} filter`}
              >
                ×
              </button>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- State A: rows overview ---

function GoldDot({ n, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-black font-black shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size < 40 ? 14 : 20,
        background: 'radial-gradient(circle at 30% 30%, #fff6c6 0%, #f5c518 40%, #8a6a00 100%)',
        boxShadow: '0 0 18px rgba(245, 197, 24, 0.35)',
      }}
    >
      {n}
    </div>
  );
}

function SilverDot({ n, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-black font-black shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size < 40 ? 14 : 20,
        background: 'radial-gradient(circle at 30% 30%, #fff 0%, #d8d8d8 40%, #6b6b6b 100%)',
        boxShadow: '0 0 14px rgba(200, 200, 200, 0.18)',
      }}
    >
      {n}
    </div>
  );
}

function EmptyMedallion() {
  return (
    <div
      className="rounded-full flex items-center justify-center text-zinc-600 font-black shrink-0"
      style={{
        width: 36, height: 36, fontSize: 14,
        background: '#111', border: '1px dashed #333',
      }}
    >
      —
    </div>
  );
}

function ProjectCell({ project, operatorCount }) {
  return (
    <div style={{ position: 'relative', paddingLeft: '0.875rem' }}>
      <div
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 4, height: '1.5em', borderRadius: 2,
          background: 'linear-gradient(180deg, #facc15, #7a5b00)',
          boxShadow: '0 0 12px rgba(250, 204, 21, 0.35)',
        }}
      />
      <div className="text-[1.35rem] font-extrabold leading-tight text-white" style={{ letterSpacing: '-0.01em' }}>
        {project}
      </div>
      <div className="text-[10px] uppercase text-muted mt-1" style={{ letterSpacing: '0.18em' }}>
        {operatorCount} {operatorCount === 1 ? 'operator' : 'operators'}
      </div>
    </div>
  );
}

function LeaderRowCell({ name, marks, widthPct }) {
  return (
    <div className="flex items-center gap-3">
      <GoldDot n={1} size={36} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{name}</div>
        <div className="h-1.5 rounded-full bg-[#262626] mt-1.5 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${widthPct}%`,
              background: 'linear-gradient(90deg, rgba(250,204,21,0.85), rgba(250,204,21,0.25))',
            }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-bold tabular-nums">{formatNumber(marks)}</div>
        <div className="text-[10px] text-muted uppercase tracking-wider">marks</div>
      </div>
    </div>
  );
}

function RunnerUpRowCell({ name, marks, widthPct }) {
  if (!name) {
    return (
      <div className="flex items-center gap-3">
        <EmptyMedallion />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-muted italic">Awaiting challenger</div>
          <div className="h-1.5 rounded-full bg-[#1a1a1a] mt-1.5 overflow-hidden" />
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold tabular-nums text-zinc-600">—</div>
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider">marks</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <SilverDot n={2} size={36} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-zinc-200">{name}</div>
        <div className="h-1.5 rounded-full bg-[#262626] mt-1.5 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${widthPct}%`,
              background: 'linear-gradient(90deg, rgba(200,200,200,0.7), rgba(200,200,200,0.15))',
            }}
          />
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-bold tabular-nums text-zinc-300">{formatNumber(marks)}</div>
        <div className="text-[10px] text-muted uppercase tracking-wider">marks</div>
      </div>
    </div>
  );
}

const ROW_GRID = { display: 'grid', gridTemplateColumns: '1.7fr 2.5fr 2.1fr 1.4fr', gap: '1rem', alignItems: 'center' };

function RowsOverview({ rows }) {
  return (
    <div>
      {/* header */}
      <div
        className="card rounded-b-none px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-muted"
        style={ROW_GRID}
      >
        <div className="text-accent" style={{ paddingLeft: '0.875rem' }}>Project</div>
        <div className="flex items-center gap-2"><span className="text-accent">🏆</span> Leader</div>
        <div className="flex items-center gap-2">🥈 Runner-up</div>
        <div className="text-right">Totals · margin</div>
      </div>
      {/* rows */}
      <div className="card rounded-t-none border-t-0 divide-y divide-[#1f1f1f]">
        {rows.map(row => {
          const leaderMarks = row.leader?.marks || 0;
          const runnerMarks = row.runnerUp?.marks || 0;
          const runnerPct = leaderMarks > 0 && runnerMarks > 0 ? Math.round((runnerMarks / leaderMarks) * 100) : 0;
          return (
            <div key={row.project} className="px-5 py-4 hover:bg-[#161616]/50 transition" style={ROW_GRID}>
              <ProjectCell project={row.project} operatorCount={row.operatorCount} />
              <LeaderRowCell name={row.leader.name} marks={row.leader.marks} widthPct={100} />
              <RunnerUpRowCell name={row.runnerUp?.name} marks={runnerMarks} widthPct={runnerPct} />
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{formatNumber(row.totalMarks)}</div>
                <div
                  className="text-[11px] tabular-nums"
                  style={{ color: row.margin != null && row.margin <= 200 ? '#facc15' : '#a3a3a3' }}
                >
                  {marginLabel(row)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- State B: single-project focus ---

function FocusView({ row }) {
  const leaderMarks = row.leader?.marks || 0;
  const totalMarks = row.totalMarks || 0;
  const leaderPct = totalMarks > 0 ? Math.round((leaderMarks / totalMarks) * 100) : 0;
  const runnerMarks = row.runnerUp?.marks || 0;
  const runnerPct = totalMarks > 0 ? Math.round((runnerMarks / totalMarks) * 100) : 0;

  return (
    <section
      className="card p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(250,204,21,0.06) 0%, rgba(250,204,21,0) 50%), #121212' }}
    >
      <div
        className="absolute rounded-full"
        style={{
          right: -80, top: -80, width: 256, height: 256,
          background: 'radial-gradient(circle, rgba(250,204,21,0.14), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div className="flex items-start justify-between flex-wrap gap-4 relative">
        <div>
          <div className="text-[11px] text-muted uppercase tracking-[0.2em]">Project focus</div>
          <div className="text-3xl font-bold mt-1">{row.project}</div>
          <div className="text-sm text-muted mt-1">
            {row.operatorCount} {row.operatorCount === 1 ? 'operator' : 'operators'} competing · {formatNumber(row.totalMarks)} total marks since season open
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-panel2 border border-border rounded-lg px-4 py-3 text-center min-w-[110px]">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted">Margin</div>
            <div className="text-xl font-bold tabular-nums mt-0.5 text-accent">
              {row.margin != null ? `+${formatNumber(row.margin)}` : '—'}
            </div>
          </div>
          <div className="bg-panel2 border border-border rounded-lg px-4 py-3 text-center min-w-[110px]">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted">Total marks</div>
            <div className="text-xl font-bold tabular-nums mt-0.5">{formatNumber(row.totalMarks)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-7 relative">
        {/* Leader panel */}
        <div
          className="md:col-span-3 bg-panel2 border border-border rounded-2xl p-6 relative overflow-hidden"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(245, 197, 24, 0.55)' }}
        >
          <div className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.2em] text-accent">Leader</div>
          <div className="flex items-center gap-5">
            <GoldDot n={1} size={80} />
            <div className="flex-1">
              <div className="text-xs text-muted">Operator</div>
              <div
                className="text-3xl font-bold mt-0.5 text-accent"
                style={{ textShadow: '0 0 20px rgba(245, 197, 24, 0.45)' }}
              >
                {row.leader.name}
              </div>
              <div className="text-sm text-zinc-400 mt-1">
                leading with <span className="tabular-nums font-semibold text-zinc-200">{formatNumber(leaderMarks)}</span> marks
              </div>
            </div>
            <div className="text-5xl">🏆</div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-[11px] text-muted mb-1">
              <span>marks (% of project total)</span>
              <span className="tabular-nums">{leaderPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#262626] overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${leaderPct}%`,
                  background: 'linear-gradient(90deg, rgba(250,204,21,0.85), rgba(250,204,21,0.25))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Runner-up panel */}
        <div
          className="md:col-span-2 bg-panel2 border border-border rounded-2xl p-6 relative overflow-hidden"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(200, 200, 200, 0.25)' }}
        >
          <div className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.2em] text-zinc-400">Runner-up</div>
          {row.runnerUp ? (
            <>
              <div className="flex items-center gap-4">
                <SilverDot n={2} size={64} />
                <div className="flex-1">
                  <div className="text-xs text-muted">Operator</div>
                  <div className="text-2xl font-bold mt-0.5 text-zinc-200">{row.runnerUp.name}</div>
                  <div className="text-sm text-muted mt-1">
                    <span className="tabular-nums font-semibold text-zinc-300">{formatNumber(runnerMarks)}</span> marks
                  </div>
                </div>
                <div className="text-3xl">🥈</div>
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-[11px] text-muted mb-1">
                  <span>marks (% of project total)</span>
                  <span className="tabular-nums">{runnerPct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#262626] overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${runnerPct}%`,
                      background: 'linear-gradient(90deg, rgba(200,200,200,0.7), rgba(200,200,200,0.15))',
                    }}
                  />
                </div>
              </div>
              <div className="mt-5 text-center bg-[#0c0c0c] border border-border rounded-lg py-3">
                <div className="text-[10px] uppercase tracking-[0.15em] text-muted">Gap to leader</div>
                <div className="text-sm font-semibold tabular-nums mt-0.5 text-accent">
                  -{formatNumber(row.margin || 0)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <EmptyMedallion />
              <div className="mt-3 font-medium text-muted">Awaiting challenger</div>
              <div className="text-xs text-zinc-600 mt-1">No one else has marks on this project yet.</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- State C: empty ---

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div
        className="h-16 w-16 mx-auto rounded-full flex items-center justify-center"
        style={{ background: 'rgba(250,204,21,0.08)', border: '1px dashed rgba(250,204,21,0.4)' }}
      >
        <span className="text-accent text-2xl">🏆</span>
      </div>
      <div className="mt-4 font-semibold text-lg">Championship opens today</div>
      <div className="text-sm text-muted mt-1 max-w-md mx-auto">
        Season starts Apr 17, 2026. No qualifying entries yet — your first paste on the Paste page kicks it off.
      </div>
    </div>
  );
}

// ---------------- main page ----------------

export default function Championship() {
  const { entries, loading, error, refresh } = useEntries();
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => { refresh(); }, [refresh]);

  const projectOptions = useMemo(() => uniqueProjects(entries), [entries]);
  const rows = useMemo(
    () => computeChampionship(entries, selectedProject ? { project: selectedProject } : undefined),
    [entries, selectedProject]
  );

  const hasData = rows.length > 0;
  const focusRow = selectedProject && rows.length === 1 ? rows[0] : null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-red-400">Couldn't reach Google Sheet.</span>
            <span className="text-muted"> — {error}</span>
          </div>
          <button className="text-xs px-3 py-1 rounded-md bg-accent text-black font-semibold" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      <PageHeader />

      <ProjectFilterBar
        projects={projectOptions}
        value={selectedProject}
        onChange={setSelectedProject}
      />

      {loading && !entries.length ? (
        <div className="card p-8 text-center text-muted text-sm">Loading championship…</div>
      ) : !hasData ? (
        <EmptyState />
      ) : focusRow ? (
        <FocusView row={focusRow} />
      ) : (
        <RowsOverview rows={rows} />
      )}
    </div>
  );
}
