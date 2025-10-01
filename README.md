## Birthday Message System

### Prerequisites
- Node.js 18+

### Setup
1. Create `.env` at repo root with:
```
PORT=3000
DATABASE_PATH=./data/app.db
HOOKBIN_URL=<your_hookbin_url>
SCHEDULER_INTERVAL_MS=60000
RECOVERY_LOOKBACK_HOURS=30
```
2. Install deps:
```
npm i
```

### Run (development)
```
npm run dev
```

### Build and start
```
npm run build && npm start
```

### API
- POST /user
```
{
  "firstName": "Alice",
  "lastName": "Doe",
  "birthday": "1990-10-02",
  "timezone": "America/New_York"
}
```
- PUT /user: same body plus `id`
- DELETE /user
```
{ "id": "<uuid>" }
```

### How delivery works
- Each day per user-local date, the system ensures one delivery row exists (dedupe by `userId:YYYY-MM-DD`).
- Scheduler runs every `SCHEDULER_INTERVAL_MS`, generates missing rows over a lookback window, and sends at/after 9:00 local time.
- Sends `"Hey, {full_name} it's your birthday"` to your `HOOKBIN_URL`.

### Testing
```
npm test
```
- Unit: time computations.
- Integration: basic API lifecycle.

### Notes
- Uses SQLite (`better-sqlite3`) with WAL for concurrency; safe upserts avoid duplicates.
- Extendable to other occasions by adding new generators and messages.

