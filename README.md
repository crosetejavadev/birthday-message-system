## Birthday Message System

### Prerequisites 
- Node.js 18+

### Setup
1. Created `.env` at repo root with:
```
PORT=3000
DATABASE_PATH=./data/app.db
HOOKBIN_URL=<your_hookbin_url>
SCHEDULER_INTERVAL_MS=60000
RECOVERY_LOOKBACK_HOURS=30
```
2. Install dependencies:
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

### Tested end-to-end with webhook URL 
1. Added webhook URL in `.env`:
```
HOOKBIN_URL=https://eok9v3s5eix1emd.m.pipedream.net
```
Restart the app after editing `.env`:
```
npm run dev
```

2. Created a user with birthday = today in a timezone where it’s already past 9:00 AM (sends on next scheduler tick):
```
curl -X POST http://localhost:3000/user ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"birthday\":\"%date:~10,4%-%date:~4,2%-%date:~7,2%\",\"timezone\":\"Pacific/Auckland\"}"
```
Example response:
```
{"id":"76d5281c-93eb-4019-9f1a-0b9ace3d05c4","firstName":"Test","lastName":"User","birthday":"2025-10-01","timezone":"Pacific/Auckland","createdAt":"2025-10-01T08:23:49.945Z","updatedAt":"2025-10-01T08:23:49.945Z"}
```

3. Updated the user (PUT):
```
curl -X PUT http://localhost:3000/user ^
  -H "Content-Type: application/json" ^
  -d "{\"id\":\"76d5281c-93eb-4019-9f1a-0b9ace3d05c4\",\"firstName\":\"Alice\",\"lastName\":\"Doe\",\"birthday\":\"1990-10-02\",\"timezone\":\"America/New_York\"}"
```

4. Deleted the user (DELETE):
```
curl -X DELETE http://localhost:3000/user -H "Content-Type: application/json" -d "{\"id\":\"76d5281c-93eb-4019-9f1a-0b9ace3d05c4\"}"
```

5. Checked webhook inbox to see the payload:
```
{ "message": "Hey, {full_name} it’s your birthday", "fullName": "Test User" }
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
