# Future Note

Hyper-minimal locked note sharing. Try it out @ https://futurenote.io

## Run

If you want to run it locally for whatever reason:!
<img width="1909" height="1019" alt="Screenshot 2026-03-02 at 12 58 55 am" src="https://github.com/user-attachments/assets/5ca262de-972b-4e52-95b5-844d843d1a72" />
<img width="1906" height="1040" alt="Screenshot 2026-03-02 at 12 59 14 am" src="https://github.com/user-attachments/assets/6d48c62f-35bb-4b37-8ecd-b6db4963a29b" />
<img width="1908" height="1037" alt="Screenshot 2026-03-02 at 12 59 45 am" src="https://github.com/user-attachments/assets/2a8555d0-6b5d-4c85-b384-c778105959e5" />
<img width="1905" height="1035" alt="Screenshot 2026-03-02 at 12 59 54 am" src="https://github.com/user-attachments/assets/45e4fd76-a7bc-4aee-be05-6d8038af5022" />


```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

## Runtime Configuration

The app supports environment-aware persistence adapters:

- `STORAGE_ADAPTER=file` (default for local development)
- `STORAGE_ADAPTER=upstash` (durable adapter for production)

Environment variables:

- `NODE_ENV`: runtime mode (`development` or `production`)
- `PUBLIC_BASE_URL`: canonical origin for generated `share_url` values (required in production)
- `STORAGE_ADAPTER`: `file` or `upstash`
- `FILE_DB_PATH`: optional JSON path for file storage mode
- `UPSTASH_REDIS_REST_URL`: required when `STORAGE_ADAPTER=upstash`
- `UPSTASH_REDIS_REST_TOKEN`: required when `STORAGE_ADAPTER=upstash`
- `UPSTASH_REDIS_KEY`: optional Redis key (default: `future-note:db`)

## Product Flow

1. Create a locked note from the single central input.
2. The app returns:
   - Share URL (`/n/<share_token>`) for recipients.
   - Management token for sender-only unlock actions.
3. Sender notes are stored locally in browser `localStorage` under a versioned history key.
4. Recipient opening the share URL sees locked state until sender unlocks.
5. After sender unlock, recipient clicks **Unlock and View Message** to reveal content.

## API (No Auth)

- `POST /api/notes`
  - body: `{ "message": "..." }`
  - returns: share URL + share token + management token + note metadata
- `GET /api/share/:shareToken`
  - returns locked/revealed status and proof metadata
- `POST /api/share/:shareToken/unlock`
  - reveals content only when sender has already unlocked
- `POST /api/manage/:noteId/unlock`
  - body: `{ "manage_token": "..." }`
  - sender unlock endpoint (idempotent)
- `GET /api/manage/:noteId?manage_token=...`
  - returns sender-authorized status view
- `GET /api/health`
  - returns readiness based on persistence dependency availability

## Local History

The app stores sender entries locally with:

- `note_id`
- `share_token`
- `share_url`
- `manage_token`
- status and proof metadata

Corrupt or invalid stored entries are ignored safely so create/view flows continue.

## Deploying to Vercel

This repo includes:

- `api/[...route].js` for backend API handling in Vercel serverless runtime
- `vercel.json` rewrites for SPA deep links (`/n/:shareToken`, `/m/:noteId`)

### Required Vercel Environment Variables

Set these in Vercel Project Settings before production deployment:

- `NODE_ENV=production`
- `PUBLIC_BASE_URL=https://<your-domain>`
- `STORAGE_ADAPTER=upstash`
- `UPSTASH_REDIS_REST_URL=<your-upstash-rest-url>`
- `UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>`
- Optional: `UPSTASH_REDIS_KEY=future-note:db`

`STORAGE_ADAPTER=file` is intentionally rejected in production boot to avoid ephemeral filesystem data loss.

### Production Verification Checklist

After deploying to preview/production:

1. `GET /api/health` returns `200` and `"ok": true`.
2. Create a note via UI and confirm returned `share_url` starts with `PUBLIC_BASE_URL`.
3. Open the shared `/n/<share_token>` URL directly and confirm the SPA renders.
4. Trigger sender unlock, then recipient unlock, and confirm reveal works end-to-end.
5. Re-check `/api/health` after write/read operations.
