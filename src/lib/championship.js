// Championship: per-project leader and runner-up by total marks.
// Counts only entries dated on or after CHAMPIONSHIP_START.
// Project filter narrows the result; other filters (operator/robot/date)
// are intentionally ignored — the championship is its own scope.

export const CHAMPIONSHIP_START = '2026-04-17';

/**
 * @param {Array<{ project: string, operator: string, marks: number|string, date: string }>} entries
 * @param {{ project?: string }} [opts]
 * @returns {Array<{
 *   project: string,
 *   leader: { name: string, marks: number } | null,
 *   runnerUp: { name: string, marks: number } | null,
 *   totalMarks: number,
 *   operatorCount: number,
 *   margin: number | null,
 * }>}
 */
export function computeChampionship(entries, { project } = {}) {
  // 1. keep only entries on/after season start
  const postStart = (entries || []).filter(
    e => e && e.date && String(e.date) >= CHAMPIONSHIP_START
  );

  // 2. project filter (case-insensitive)
  const projectFilter = project ? String(project).toLowerCase() : '';
  const filtered = projectFilter
    ? postStart.filter(e => String(e.project || '').toLowerCase() === projectFilter)
    : postStart;

  // 3. group: project → operator → sum(marks)
  const byProject = new Map();
  for (const e of filtered) {
    if (!e.project || !e.operator) continue;
    const marks = Number(e.marks) || 0;
    if (!byProject.has(e.project)) byProject.set(e.project, new Map());
    const opMap = byProject.get(e.project);
    opMap.set(e.operator, (opMap.get(e.operator) || 0) + marks);
  }

  // 4. shape result rows
  const result = [];
  for (const [proj, opMap] of byProject) {
    const ops = Array.from(opMap.entries())
      .map(([name, marks]) => ({ name, marks }))
      // tie-break: higher marks wins; tie → alphabetical for stability
      .sort((a, b) => (b.marks - a.marks) || a.name.localeCompare(b.name));
    const totalMarks = ops.reduce((s, o) => s + o.marks, 0);
    const leader = ops[0] || null;
    const runnerUp = ops[1] || null;
    const margin = leader && runnerUp ? leader.marks - runnerUp.marks : null;
    result.push({
      project: proj,
      leader,
      runnerUp,
      totalMarks,
      operatorCount: ops.length,
      margin,
    });
  }

  // 5. sort: project with the most marks first
  result.sort((a, b) => (b.totalMarks - a.totalMarks) || a.project.localeCompare(b.project));
  return result;
}
