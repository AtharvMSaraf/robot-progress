# Robot Progress — Setup Guide

A daily-progress dashboard for robot operations, backed by a Google Sheet through an Apps Script web app. Follow the three parts below in order.

Total time: ~15 minutes.

---

## Part A — Create the Google Sheet

1. Open [sheets.new](https://sheets.new) (this creates a blank Google Sheet).
2. Rename the file at the top-left — suggested name: **Robot Progress DB**.
3. **Copy the Sheet ID** from the URL — you will need it in Part B.
   The URL looks like:
   ```
   https://docs.google.com/spreadsheets/d/<THIS_PART_IS_THE_ID>/edit
   ```
4. You have two options for creating the tabs and headers:

### Option 1 (recommended) — let Apps Script create the tabs for you
Skip ahead to Part B. The `initSheet` function in the script creates both tabs with the correct headers and styling in one click.

### Option 2 — create the tabs manually
Create exactly two tabs with these **exact** names and headers in row 1:

**Tab name: `entries`** (lowercase)

| id | createdAt | date | robotId | operator | project | marks | location | startTime | endTime | shiftDurationMin | notes | rawText |
|----|-----------|------|---------|----------|---------|-------|----------|-----------|---------|------------------|-------|---------|

**Tab name: `raw_reports`** (lowercase, with underscore)

| id | pastedAt | pastedBy | rawText | parsedCount | warningCount |
|----|----------|----------|---------|-------------|--------------|

Delete the default `Sheet1` tab when you're done. Freeze row 1 for readability (`View → Freeze → 1 row`).

> Tab names and header names must match exactly — the backend reads them by name.

---

## Part B — Attach the Apps Script backend

1. In the Google Sheet, go to **Extensions → Apps Script**. A new tab opens with an empty script project called `Untitled project`. Rename it to **Robot Progress Backend** (click the title at the top).
2. In the left sidebar, delete the default `Code.gs` contents.
3. Open [`apps-script/Code.gs`](./apps-script/Code.gs) from this project, copy the entire contents, and paste it into the Apps Script editor. Click the **disk icon** (Save project) or press ⌘/Ctrl-S.
4. Add the Sheet ID as a Script Property so the script knows which Sheet to write to:
   - In the Apps Script editor, click the **gear icon** (Project Settings) in the left sidebar.
   - Scroll to **Script Properties** and click **Add script property**.
   - Property name: `SHEET_ID`
   - Value: *the Sheet ID you copied in Part A, Step 3*
   - Click **Save script properties**.
5. Initialise the tabs (only needed if you used Option 1 in Part A, but safe to run either way):
   - Go back to the **Editor** (leftmost icon).
   - At the top, to the right of the **Run** button, pick the function `initSheet` from the dropdown.
   - Click **Run**. Google will prompt you to **Review permissions** the first time:
     - Choose your Google account → **Advanced** → **Go to Robot Progress Backend (unsafe)** → **Allow**.
     - This authorises the script to edit your Sheet. It doesn't give anyone else access.
   - When it finishes, open your Sheet — you should see two tabs (`entries`, `raw_reports`) with bold black+yellow headers.
6. Deploy as a web app:
   - Click **Deploy → New deployment** (top-right).
   - Click the **gear icon** next to "Select type" → choose **Web app**.
   - Fill in:
     - **Description:** `Robot Progress v1`
     - **Execute as:** *Me (your email)*
     - **Who has access:** *Anyone with the link*
   - Click **Deploy**. Approve the OAuth prompt again if asked.
   - Copy the **Web app URL** that ends in `/exec`. It looks like:
     ```
     https://script.google.com/macros/s/AKfyc.../exec
     ```
     You'll paste this into `.env.local` in Part C.
7. (Optional) Smoke test: open the URL in a new browser tab, appending `?action=ping`:
   ```
   https://script.google.com/macros/s/AKfyc.../exec?action=ping
   ```
   You should see `{"ok":true,"ts":"2026-..."}`.

### Re-deploying after code changes
Apps Script caches deployments. If you edit `Code.gs` later, either:
- **Deploy → Manage deployments** → pencil icon next to the existing deployment → set **Version** to *New version* → **Deploy**. This keeps the URL the same.
- Or create a new deployment and update `.env.local`.

---

## Part C — Configure and run the React app

> Requires Node.js 18+ installed (`node -v` to check).

1. From this project folder:
   ```
   npm install
   ```
2. Copy the env template and paste in your Apps Script URL:
   ```
   cp .env.example .env.local
   ```
   Open `.env.local` and set:
   ```
   VITE_SHEETS_ENDPOINT=https://script.google.com/macros/s/AKfyc.../exec
   ```
3. Run the dev server:
   ```
   npm run dev
   ```
   Open the printed URL (usually http://localhost:5173).

The Dashboard loads by fetching from your Sheet. The Parse page lets you paste a report (see `sample-reports.txt`), preview what will be saved, and commit it to the Sheet. The Sheet itself is the source of truth — you can open it any time to audit or edit rows directly.

---

## Troubleshooting

**"Script Property SHEET_ID is not set."** — You skipped Part B step 4. Set it and redeploy.

**"Missing sheet tab: entries"** — Tabs don't exist or are named differently. Run `initSheet` from the Apps Script editor to create them.

**CORS error in the browser console** — The frontend already sends `Content-Type: text/plain` on POSTs to avoid preflight. If you still see CORS errors, make sure you deployed as **Web app** (not "API executable") and that access is set to **Anyone with the link**.

**`{"ok":false,"error":"Authorization is required…"}`** — Open the `/exec` URL in a browser while signed in, re-authorise, and redeploy.

**Data looks stale after editing in the Sheet** — Click the circular refresh icon in the top-right of the dashboard filter bar.
