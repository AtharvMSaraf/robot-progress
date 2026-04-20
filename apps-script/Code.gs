/**
 * Robot Progress — Google Apps Script backend.
 *
 * Exposes a web-app URL that the React dashboard calls.
 *
 * Endpoints:
 *   GET  ?action=list   → { ok, entries: [...] }
 *   GET  ?action=ping   → { ok, ts }
 *   POST action=save    → appends to `entries` and `raw_reports`
 *   POST action=delete  → removes a single row from `entries` by id
 *
 * Before deploying:
 *   1) Create a Google Sheet with two tabs: `entries` and `raw_reports`
 *      (or run the `initSheet` function once from the editor to create them).
 *   2) In Project Settings → Script Properties, add:
 *        Key:   SHEET_ID
 *        Value: <spreadsheet id from the URL>
 *   3) Deploy → New deployment → Web app
 *        Execute as: Me
 *        Who has access: Anyone with the link
 *      Copy the /exec URL and put it in the React app's .env.local as
 *        VITE_SHEETS_ENDPOINT=<that URL>
 */

const SHEET_ID_KEY = 'SHEET_ID';
const TAB_ENTRIES  = 'entries';
const TAB_RAW      = 'raw_reports';

const ENTRIES_COLS = [
  'id', 'createdAt', 'date', 'robotId', 'operator', 'project', 'marks',
  'location', 'startTime', 'endTime', 'shiftDurationMin', 'notes', 'rawText'
];

const RAW_COLS = [
  'id', 'pastedAt', 'pastedBy', 'rawText', 'parsedCount', 'warningCount'
];

// ------------------------ Web-app entry points ------------------------

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'list';
    if (action === 'list') return jsonOut_({ ok: true, entries: listEntries_() });
    if (action === 'ping') return jsonOut_({ ok: true, ts: new Date().toISOString() });
    return jsonOut_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    // Frontend sends Content-Type: text/plain to avoid CORS preflight, body is JSON.
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action || 'save';
    if (action === 'save') {
      const entries = Array.isArray(body.entries) ? body.entries : [];
      const inserted = saveEntries_(entries);
      if (body.rawReport) saveRaw_(body.rawReport);
      return jsonOut_({ ok: true, inserted: inserted });
    }
    if (action === 'delete') {
      const deleted = deleteEntry_(String(body.id || ''));
      return jsonOut_({ ok: true, deleted: deleted });
    }
    return jsonOut_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message || err) });
  }
}

// ------------------------ Core operations ------------------------

function listEntries_() {
  const sh = getSheet_(TAB_ENTRIES);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => String(row[0] || '').length).map(row => {
    const o = {};
    headers.forEach((h, i) => { o[h] = row[i]; });
    if (o.date instanceof Date) o.date = formatYMD_(o.date);
    if (typeof o.marks === 'string') o.marks = Number(o.marks) || 0;
    if (typeof o.shiftDurationMin === 'string') o.shiftDurationMin = Number(o.shiftDurationMin) || null;
    return o;
  });
}

function saveEntries_(entries) {
  if (!entries.length) return 0;
  const sh = getSheet_(TAB_ENTRIES);
  const rows = entries.map(e => ENTRIES_COLS.map(c => (e[c] === undefined || e[c] === null) ? '' : e[c]));
  const startRow = sh.getLastRow() + 1;
  sh.getRange(startRow, 1, rows.length, ENTRIES_COLS.length).setValues(rows);
  return rows.length;
}

function saveRaw_(raw) {
  const sh = getSheet_(TAB_RAW);
  const row = RAW_COLS.map(c => (raw[c] === undefined || raw[c] === null) ? '' : raw[c]);
  sh.appendRow(row);
}

function deleteEntry_(id) {
  if (!id) return 0;
  const sh = getSheet_(TAB_ENTRIES);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      sh.deleteRow(i + 1);
      return 1;
    }
  }
  return 0;
}

// ------------------------ Helpers ------------------------

function getSheet_(name) {
  const id = PropertiesService.getScriptProperties().getProperty(SHEET_ID_KEY);
  if (!id) throw new Error('Script Property SHEET_ID is not set. See SETUP.md.');
  const ss = SpreadsheetApp.openById(id);
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing sheet tab: "' + name + '". Run initSheet() once.');
  return sh;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatYMD_(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

// ------------------------ One-time setup helper ------------------------

/**
 * Run this once from the Apps Script editor (Run → initSheet) after you
 * have set the SHEET_ID Script Property. Creates the two tabs with the
 * correct headers, styled and with row 1 frozen.
 */
function initSheet() {
  const id = PropertiesService.getScriptProperties().getProperty(SHEET_ID_KEY);
  if (!id) throw new Error('Set SHEET_ID Script Property first (Project Settings → Script Properties).');
  const ss = SpreadsheetApp.openById(id);

  [[TAB_ENTRIES, ENTRIES_COLS], [TAB_RAW, RAW_COLS]].forEach(function (pair) {
    const name = pair[0], cols = pair[1];
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#0a0a0a').setFontColor('#facc15');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, cols.length);
    }
  });

  // Remove the default "Sheet1" if it's empty.
  const def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
}
