import { useEffect, useMemo, useState } from 'react';
import { useEntries } from '../store/useEntries.js';
import { applyFilters, presetRange } from '../lib/filters.js';
import { aggregate } from '../lib/aggregate.js';
import FilterBar from '../components/FilterBar.jsx';
import KpiCard from '../components/KpiCard.jsx';
import EntriesTable from '../components/EntriesTable.jsx';
import { TrendChart, ProjectChart, RobotChart, OperatorChart, useChartDefaults } from '../components/charts/Charts.jsx';

function initialFilters() {
  const { from, to } = presetRange('7d');
  return { preset: '7d', from, to, project: '', operator: '', robotId: '', search: '' };
}

export default function Dashboard() {
  useChartDefaults();
  const { entries, loading, error, refresh } = useEntries();
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => applyFilters(entries, filters), [entries, filters]);
  const agg = useMemo(() => aggregate(filtered), [filtered]);

  const statusText = `Showing ${filtered.length} entries · ${filters.from || '—'} → ${filters.to || '—'}`;

  return (
    <div className="space-y-6">
      {error && (
        <div className="card p-3 border-red-500/30 bg-red-500/5 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-red-400">Couldn't reach Google Sheet.</span>
            <span className="text-muted"> — {error}</span>
          </div>
          <button className="text-xs px-3 py-1 rounded-md bg-accent text-black font-semibold" onClick={refresh}>Retry</button>
        </div>
      )}

      <FilterBar
        entries={entries}
        filters={filters}
        onChange={setFilters}
        onRefresh={refresh}
        loading={loading}
        statusText={statusText}
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total marks marked" value={agg.totalMarks.toLocaleString()} loading={loading && !entries.length} />
        <KpiCard label="Active robots"      value={agg.activeRobots} loading={loading && !entries.length} />
        <KpiCard label="Active operators"   value={agg.activeOperators} loading={loading && !entries.length} />
        <KpiCard label="Active projects"    value={agg.activeProjects} loading={loading && !entries.length} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Daily progress trend</div>
            <div className="text-xs text-muted">Marks per day</div>
          </div>
          <div style={{ height: 220 }}>
            <TrendChart byDay={agg.byDay} />
          </div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-2">Project breakdown</div>
          <div style={{ height: 220 }}>
            <ProjectChart byProject={agg.byProject} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-medium mb-2">Robot breakdown</div>
          <div style={{ height: 220 }}>
            <RobotChart byRobot={agg.byRobot} />
          </div>
        </div>
        <div className="card p-4">
          <div className="font-medium mb-2">Operator breakdown</div>
          <div style={{ height: 220 }}>
            <OperatorChart byOperator={agg.byOperator} />
          </div>
        </div>
      </section>

      <EntriesTable entries={filtered} />
    </div>
  );
}
