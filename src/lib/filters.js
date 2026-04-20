// Pure filter helpers. No React, no I/O.

export const DATE_PRESETS = ['today', '7d', '30d', 'quarter', 'custom'];

export function presetRange(preset, today = new Date()) {
  const end = new Date(today); end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  switch (preset) {
    case 'today':   break;                                 // start = end = today
    case '7d':      start.setDate(end.getDate() - 6); break;
    case '30d':     start.setDate(end.getDate() - 29); break;
    case 'quarter': start.setDate(end.getDate() - 89); break;
    case 'custom':
    default:        return { from: null, to: null };
  }
  return { from: toYMD(start), to: toYMD(end) };
}

export function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function applyFilters(entries, filters) {
  const { from, to, project, operator, robotId, search } = filters || {};
  const q = (search || '').trim().toLowerCase();
  return entries.filter(e => {
    if (project && e.project !== project) return false;
    if (operator && e.operator !== operator) return false;
    if (robotId && e.robotId !== robotId) return false;
    if (from && e.date && e.date < from) return false;
    if (to && e.date && e.date > to) return false;
    if (q) {
      const hay = [e.project, e.operator, e.robotId, e.location, e.notes, e.date].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function uniqueValues(entries, key) {
  return Array.from(new Set(entries.map(e => e[key]).filter(v => v !== undefined && v !== null && v !== ''))).sort();
}
