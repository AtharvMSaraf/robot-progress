// WhatsApp-style daily report parser.
//
// parseReports(text) -> [{ id, date, robotId, operator, project, marks, location?, startTime?, endTime?, shiftDurationMin?, notes?, rawText, warnings, valid }]
//
// Lenient by design. Case-insensitive, separator-tolerant, supports emojis/bullets,
// multiple date formats. Slash dates default to DD/MM/YYYY with a soft warning.

const SYNONYMS = {
  // Order within each field doesn't matter; label-length sort handles precedence.
  robotId:  ['robot id', 'robot no', 'robot number', 'robot', 'machine', 'unit'],
  operator: ['operated by', 'operator', 'op', 'by'],
  project:  ['site project', 'project', 'job'],
  date:     ['shift date', 'date', 'on'],
  marks:    ['marks marked', 'total marks', 'marks', 'marked', 'count', 'total'],
  location: ['location', 'site', 'zone', 'area'],
  startTime:['start time', 'start', 'from'],
  endTime:  ['end time', 'end', 'to', 'till'],
  notes:    ['notes', 'remarks', 'comments'],
};

const LABELS = [];
for (const [field, labels] of Object.entries(SYNONYMS)) {
  for (const l of labels) LABELS.push([l, field]);
}
// Longer labels first so "robot number" wins over "robot".
LABELS.sort((a, b) => b[0].length - a[0].length);

const SEP_CLASS = '[:\\-\\u2013=]';   // : - – =
const LINE_SEP_RE = new RegExp(`^(.+?)\\s*(?:${SEP_CLASS}|\\s)\\s*(.+)$`);

function stripLeading(line) {
  return line.replace(/^[\s\u2022\u00b7\-*\u25aa\u25cf\u25e6>#\d.)\]]+/u, '')
             .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '')
             .trimStart();
}

export function parseDate(raw) {
  const s = String(raw || '').trim();
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { iso: `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`, warnings: [] };
  // DD/MM/YYYY or DD-MM-YYYY → default DD/MM/YYYY
  m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10), mo = parseInt(m[2], 10), y = m[3];
    if (d < 1 || d > 31 || mo < 1 || mo > 12) {
      return { iso: null, warnings: [`Date "${s}" has out-of-range day or month.`] };
    }
    const iso = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const warnings = [];
    if (d <= 12 && mo <= 12 && d !== mo) {
      warnings.push(`Ambiguous date "${s}" — interpreted as DD/MM/YYYY → ${iso}. Use YYYY-MM-DD if this is wrong.`);
    }
    return { iso, warnings };
  }
  // 16 Apr 2026 / 4 November 2025
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})$/);
  if (m) {
    const mi = months.indexOf(m[2].toLowerCase().slice(0, 3));
    if (mi >= 0) return { iso: `${m[3]}-${String(mi+1).padStart(2,'0')}-${String(parseInt(m[1],10)).padStart(2,'0')}`, warnings: [] };
  }
  return { iso: null, warnings: [`Unrecognized date format "${s}"`] };
}

function parseTime(raw) {
  const m = String(raw || '').trim().match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = (m[3] || '').toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

function diffMinutes(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;   // overnight shifts
  return mins;
}

function splitReports(text) {
  return String(text || '')
    .split(/\n\s*(?:---+|===+)\s*\n|\n\s*\n\s*\n+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function uid() {
  return 'e_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function matchLabel(line) {
  const lineMatch = line.match(LINE_SEP_RE);
  if (!lineMatch) return null;
  const headRaw = lineMatch[1].toLowerCase().replace(/\s+/g, ' ').trim();
  const tail = lineMatch[2].trim();
  for (const [label, field] of LABELS) {
    if (headRaw === label || headRaw.startsWith(label + ' ') || headRaw === label.replace(/\s+/g, '')) {
      return { field, value: tail };
    }
  }
  return null;
}

function parseReport(block) {
  const lines = block.split('\n').map(stripLeading).filter(l => l.length);
  const out = {
    id: uid(),
    rawText: block,
    warnings: [],
  };
  for (const line of lines) {
    const matched = matchLabel(line);
    if (!matched) {
      // Ignore headings like "Daily report" silently, but record short ones as info.
      if (line.length > 40) out.warnings.push(`Ignored line: "${line.slice(0, 60)}${line.length > 60 ? '…' : ''}"`);
      continue;
    }
    if (matched.field === 'date') {
      const d = parseDate(matched.value);
      out.date = d.iso;
      out.warnings.push(...d.warnings);
    } else if (matched.field === 'robotId') {
      // Robots are identified by number only — strip letters, hyphens, # etc.
      // Leading zeros are normalized away so "07" and "7" are the same robot.
      // The (?=\d) lookahead keeps at least one digit, so "0" and "000" → "0".
      const raw = String(matched.value);
      const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
      if (!digits) {
        out.warnings.push(`Robot ID "${raw}" contains no digits; value ignored.`);
      } else {
        out.robotId = digits;
      }
    } else if (matched.field === 'marks') {
      const n = parseInt(String(matched.value).replace(/[,\s]/g, ''), 10);
      if (!Number.isFinite(n)) out.warnings.push(`Marks not numeric: "${matched.value}"`);
      else out.marks = n;
    } else if (matched.field === 'startTime' || matched.field === 'endTime') {
      // Sometimes written as one line: "Start 08:00  End 16:30"
      const t = parseTime(matched.value.split(/\s+/)[0]);
      if (t) out[matched.field] = t;
      // Second half may contain the other time.
      const rest = matched.value.slice(matched.value.indexOf(' ')).trim();
      const secondMatch = rest.match(/(end|till|to|from|start)\s*[:\-]?\s*(\S+)/i);
      if (secondMatch) {
        const otherField = /start|from/i.test(secondMatch[1]) ? 'startTime' : 'endTime';
        const t2 = parseTime(secondMatch[2]);
        if (t2) out[otherField] = t2;
      }
    } else {
      out[matched.field] = matched.value;
    }
  }

  if (out.startTime && out.endTime) {
    out.shiftDurationMin = diffMinutes(out.startTime, out.endTime);
  }

  const required = ['robotId', 'operator', 'project', 'date', 'marks'];
  for (const r of required) {
    if (out[r] === undefined || out[r] === null || out[r] === '') {
      out.warnings.push(`Missing required field: ${r}`);
    }
  }
  out.valid = required.every(r => out[r] !== undefined && out[r] !== null && out[r] !== '');
  out.createdAt = new Date().toISOString();
  return out;
}

export function parseReports(text) {
  return splitReports(text).map(parseReport);
}
