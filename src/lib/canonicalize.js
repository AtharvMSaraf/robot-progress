// Canonicalization of project and operator names against existing values.
// Applied on the Parse page before entries are written to the Sheet, so the
// dashboard never sees case or first-name duplicates. Existing rows in the
// Sheet are not rewritten — only new entries are normalized.

export function canonicalizeProject(name, existingProjects = []) {
  if (!name) return { value: name, warnings: [] };
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase();
  const found = existingProjects.find(p => String(p).toLowerCase() === lower);
  if (found && found !== trimmed) {
    return {
      value: found,
      warnings: [`Project "${trimmed}" matched existing "${found}" (case-insensitive). Saved as "${found}".`],
    };
  }
  return { value: found || trimmed, warnings: [] };
}

export function canonicalizeOperator(name, existingOperators = []) {
  if (!name) return { value: name, warnings: [] };
  const trimmed = String(name).trim();
  const lower = trimmed.toLowerCase();

  // 1. Exact case-insensitive match — prefer the existing saved form.
  const exact = existingOperators.find(o => String(o).toLowerCase() === lower);
  if (exact) {
    return {
      value: exact,
      warnings: exact === trimmed
        ? []
        : [`Operator "${trimmed}" matched existing "${exact}" (case-insensitive). Saved as "${exact}".`],
    };
  }

  // 2. First-name-token match — "Raj" <-> "Raj Kumar".
  const firstToken = lower.split(/\s+/)[0];
  if (!firstToken) return { value: trimmed, warnings: [] };

  const tokenMatches = existingOperators.filter(o => {
    const t = String(o).toLowerCase().split(/\s+/)[0];
    return t === firstToken;
  });

  if (tokenMatches.length === 1) {
    const match = tokenMatches[0];
    return {
      value: match,
      warnings: [`Operator "${trimmed}" matched existing "${match}" (same first name). Saved as "${match}" to avoid duplicates.`],
    };
  }

  if (tokenMatches.length > 1) {
    // Ambiguous — pick the first alphabetically for determinism but flag it.
    const sorted = [...tokenMatches].sort();
    const chosen = sorted[0];
    return {
      value: chosen,
      warnings: [
        `Operator "${trimmed}" is ambiguous — could match ${tokenMatches.map(m => `"${m}"`).join(', ')}. Saved as "${chosen}". Edit in the Sheet if this is wrong.`,
      ],
    };
  }

  return { value: trimmed, warnings: [] };
}

export function canonicalizeEntry(entry, { projects = [], operators = [] } = {}) {
  const p = canonicalizeProject(entry.project, projects);
  const o = canonicalizeOperator(entry.operator, operators);
  return {
    ...entry,
    project: p.value,
    operator: o.value,
    warnings: [...(entry.warnings || []), ...p.warnings, ...o.warnings],
  };
}
