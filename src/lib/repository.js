// Repository: the only module that talks to the Apps Script web app.
// Swap this out (e.g. for a Node/Express backend) without touching UI code.

const ENDPOINT = import.meta.env.VITE_SHEETS_ENDPOINT || '';

function assertEndpoint() {
  if (!ENDPOINT) {
    throw new Error('VITE_SHEETS_ENDPOINT is not set. Copy .env.example to .env.local and paste your Apps Script /exec URL.');
  }
}

async function jsonFetch(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  const body = await res.json();
  if (body && body.ok === false) throw new Error(body.error || 'Unknown error from backend');
  return body;
}

export async function listEntries() {
  assertEndpoint();
  const body = await jsonFetch(`${ENDPOINT}?action=list`, { method: 'GET' });
  return Array.isArray(body.entries) ? body.entries : [];
}

export async function saveBatch(entries, rawReport) {
  assertEndpoint();
  const body = await jsonFetch(ENDPOINT, {
    method: 'POST',
    // text/plain avoids a CORS preflight — Apps Script still parses JSON.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'save', entries, rawReport }),
  });
  return body.inserted || 0;
}

export async function deleteEntry(id) {
  assertEndpoint();
  const body = await jsonFetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', id }),
  });
  return body.deleted || 0;
}

export async function ping() {
  assertEndpoint();
  return jsonFetch(`${ENDPOINT}?action=ping`, { method: 'GET' });
}
