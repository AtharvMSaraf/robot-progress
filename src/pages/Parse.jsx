import { useEffect, useMemo, useState } from 'react';
import { parseReports } from '../lib/parser.js';
import { canonicalizeEntry } from '../lib/canonicalize.js';
import { uniqueValues } from '../lib/filters.js';
import { useEntries } from '../store/useEntries.js';

function EntryPreviewCard({ e, idx }) {
  return (
    <div className={'card p-3 ' + (!e.valid ? 'border-red-500/40' : '')}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">Entry #{idx + 1}</div>
        <span className={'text-xs font-semibold ' + (e.valid ? 'text-accent' : 'text-red-400')}>
          {e.valid ? 'VALID' : 'INVALID'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
        <div><span className="text-muted">Date</span> <span className="ml-2">{e.date || '—'}</span></div>
        <div><span className="text-muted">Robot</span> <span className="ml-2">{e.robotId || '—'}</span></div>
        <div><span className="text-muted">Operator</span> <span className="ml-2">{e.operator || '—'}</span></div>
        <div><span className="text-muted">Project</span> <span className="ml-2">{e.project || '—'}</span></div>
        <div><span className="text-muted">Marks</span> <span className="ml-2 text-accent font-medium">{e.marks ?? '—'}</span></div>
        <div><span className="text-muted">Location</span> <span className="ml-2">{e.location || '—'}</span></div>
        {e.startTime && <div><span className="text-muted">Start</span> <span className="ml-2">{e.startTime}</span></div>}
        {e.endTime   && <div><span className="text-muted">End</span> <span className="ml-2">{e.endTime}</span></div>}
        {e.notes     && <div className="col-span-2"><span className="text-muted">Notes</span> <span className="ml-2">{e.notes}</span></div>}
      </div>
      {e.warnings.length > 0 && (
        <ul className="mt-2 space-y-1">
          {e.warnings.map((w, i) => (
            <li key={i} className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-1">{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Parse() {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const { entries, saveBatch, refresh } = useEntries();

  // Pull latest entries on mount so canonicalization sees current state of the Sheet.
  useEffect(() => { refresh(); }, [refresh]);

  const parsed = useMemo(() => {
    if (!text.trim()) return [];
    const raw = parseReports(text);
    let projects  = uniqueValues(entries, 'project');
    let operators = uniqueValues(entries, 'operator');
    return raw.map(e => {
      const c = canonicalizeEntry(e, { projects, operators });
      // Accumulate within a single paste so 2x "Raj" in one batch stays 1.
      if (c.project  && !projects.includes(c.project))   projects  = [...projects,  c.project];
      if (c.operator && !operators.includes(c.operator)) operators = [...operators, c.operator];
      return c;
    });
  }, [text, entries]);
  const validCount = parsed.filter(e => e.valid).length;
  const warningCount = parsed.reduce((n, e) => n + e.warnings.length, 0);

  async function onSave() {
    const validEntries = parsed.filter(e => e.valid);
    if (!validEntries.length) {
      setStatus({ type: 'error', msg: 'No valid entries to save.' });
      return;
    }
    setSaving(true); setStatus(null);
    try {
      const rawReport = {
        id: 'r_' + Date.now().toString(36),
        pastedAt: new Date().toISOString(),
        pastedBy: '',
        rawText: text,
        parsedCount: validEntries.length,
        warningCount,
      };
      const inserted = await saveBatch(validEntries, rawReport);
      setStatus({ type: 'success', msg: `Saved ${inserted} ${inserted === 1 ? 'entry' : 'entries'} to the Sheet.` });
      setText('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Paste raw reports</div>
            <div className="text-xs text-muted">Separate reports with <code>---</code> or a blank line</div>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Date: 2026-04-16\nProject: Bisha\nRobot: 72\nOperator: A\nLocation: mvps 94\nMarks: 865`}
            className="w-full h-80 input-dark font-mono text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted">
              {parsed.length} parsed · <span className="text-accent">{validCount} valid</span>
              {warningCount > 0 && <> · <span className="text-amber-300">{warningCount} warning{warningCount > 1 ? 's' : ''}</span></>}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-sm px-3 py-1.5 rounded-md" onClick={() => setText('')} disabled={!text}>Clear</button>
              <button className="btn-primary text-sm px-3 py-1.5 rounded-md disabled:opacity-40" onClick={onSave} disabled={saving || !validCount}>
                {saving ? 'Saving…' : `Save ${validCount || ''} to Sheet`}
              </button>
            </div>
          </div>
          {status && (
            <div className={'mt-3 text-sm rounded-md px-3 py-2 ' + (
              status.type === 'success'
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'
            )}>{status.msg}</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="card p-4">
          <div className="font-medium mb-2">Preview</div>
          {parsed.length === 0 ? (
            <div className="text-sm text-muted py-8 text-center">Paste text on the left to see parsed entries.</div>
          ) : (
            <div className="space-y-2">
              {parsed.map((e, i) => <EntryPreviewCard key={e.id} e={e} idx={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
