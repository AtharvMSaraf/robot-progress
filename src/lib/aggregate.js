// Pure aggregation functions over a filtered entries list.

function sumBy(entries, key) {
  const map = new Map();
  for (const e of entries) {
    const k = e[key] || '—';
    map.set(k, (map.get(k) || 0) + (Number(e.marks) || 0));
  }
  return [...map.entries()]
    .map(([label, marks]) => ({ label, marks }))
    .sort((a, b) => b.marks - a.marks);
}

export function aggregate(entries) {
  const totalMarks = entries.reduce((s, e) => s + (Number(e.marks) || 0), 0);
  const robots = new Set(entries.map(e => e.robotId).filter(Boolean));
  const operators = new Set(entries.map(e => e.operator).filter(Boolean));
  const projects = new Set(entries.map(e => e.project).filter(Boolean));

  return {
    totalMarks,
    activeRobots: robots.size,
    activeOperators: operators.size,
    activeProjects: projects.size,
    byProject: sumBy(entries, 'project'),
    byRobot:   sumBy(entries, 'robotId'),
    byOperator: sumBy(entries, 'operator'),
    byDay: computeTrend(entries),
  };
}

function computeTrend(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!e.date) continue;
    map.set(e.date, (map.get(e.date) || 0) + (Number(e.marks) || 0));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, marks]) => ({ date, marks }));
}
