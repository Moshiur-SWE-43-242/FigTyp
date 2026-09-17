---
name: testing-figtyp
description: How to run and test the FigTyp typing-trainer app locally (React/Vite frontend + Express backend + MongoDB), including the OTP/email auth workaround and browser setup. Use when testing any FigTyp feature end-to-end.
---

# Testing FigTyp locally

## Stack & ports
- Frontend: React + Vite. `npm install` at repo root, then `npm run dev`. **Vite serves on :5173** (the blueprint/notes may say 3000, but current Vite defaults to 5173 — check the `npm run dev` output).
- Backend: Express + Socket.io. `cd backend && npm install && npm run dev` (`node --watch`, port 5000).
- Frontend talks to backend via `src/config.ts` → `http://localhost:5000` by default (no `VITE_API_URL` needed locally).

## MongoDB
No local Mongo is provisioned by the blueprint. Start one with Docker:
```
docker run -d --name figtyp-mongo -p 27017:27017 mongo:6
```

## backend/.env (create from backend/.env.example)
Required: `MONGODB_URI=mongodb://localhost:27017/figtyp`, `JWT_SECRET=<long random>`, `PORT=5000`.
Optional: `ACTIVITY_LOG_TTL_DAYS` (default 90). `SUPER_ADMIN_EMAILS` defaults exist; a normal user is fine for attempts/leaderboard.

## Auth / OTP workaround (IMPORTANT)
Registration emails an OTP via Gmail. Without valid `EMAIL_USER`/`EMAIL_PASS`, `POST /api/auth/register` returns **HTTP 500 at the sendEmail step** — BUT the user + OTP are already saved to Mongo before the email is attempted. Two ways forward:
1. Read the OTP directly and verify via API/UI:
   `docker exec figtyp-mongo mongosh --quiet --eval 'print(db.getSiblingDB("figtyp").users.findOne({email:"X"},{otp:1}).otp)'`
   The UI, however, will NOT advance to the OTP screen because the register response was a 500.
2. To exercise the **full register→OTP→login UI flow**, apply a temporary env-gated shim in `backend/utils/sendEmail.js` (e.g. `if (process.env.EMAIL_TEST_NOOP==='1') return;`), restart backend with `EMAIL_TEST_NOOP=1`, then read the OTP from Mongo. **Revert the shim after testing.**

If a real Gmail App Password is provided, set `EMAIL_USER`/`EMAIL_PASS` and skip the shim.
### Devin Secrets Needed
- `EMAIL_USER` / `EMAIL_PASS` (Gmail App Password) — only if you must test the real email-send path; otherwise use the OTP-from-DB workaround.

## Reaching features in the UI
- Nav tabs (top): Practice Arena, Courses, Race Esports, Coach, PDF Certificates, About, Profile.
- Practice Arena: click the passage area and type words (space-separated). A run ends when all words are typed OR the interval timer hits 0; both save an attempt and refresh the leaderboard. The leaderboard is at the bottom of the Practice Arena.
- Profile stats (attempts count, avg/best WPM) are computed client-side from `GET /api/attempts`.

## Browser / recording setup
The `google-chrome` in PATH is a wrapper that POSTs URLs to a CDP service on :29229 (often not running). Launch the real Chrome with remote debugging so both the wrapper and computer-use work:
```
DISPLAY=:0 /opt/.devin/chrome/chrome/linux-*/chrome-linux64/chrome \
  --no-sandbox --disable-dev-shm-usage --remote-debugging-port=29229 \
  --remote-allow-origins=* --user-data-dir=/home/ubuntu/.config/devin-chrome \
  --start-maximized http://localhost:5173 &
```
Maximize with `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.

## Known pre-existing bugs (not regressions)
- **Double-save:** each completed practice run saves 2 identical attempts (~ms apart) — `terminateWordTypingRun` fires on both word-completion and timer paths.
- **Final accuracy 0%:** end-of-run results/leaderboard/profile show 0% accuracy despite live 100%. Pre-existing final-accuracy calc bug.

## Handy verification queries
```
# attempts for a user (note the Mongoose collection is 'attempts', 'activitylogs', 'users')
docker exec figtyp-mongo mongosh --quiet --eval '...db.attempts.find({userId:String(u._id)})...'
# TTL indexes
docker exec figtyp-mongo mongosh --quiet --eval 'db.getSiblingDB("figtyp").activitylogs.getIndexes()'
docker exec figtyp-mongo mongosh --quiet --eval 'db.getSiblingDB("figtyp").users.getIndexes()'
```
TTL functional tests: insert docs with backdated `createdAt`/`otpExpires`, wait ~90s (Mongo TTL monitor runs every 60s), re-query.
