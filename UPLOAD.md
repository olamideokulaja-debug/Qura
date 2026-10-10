# SEND tender feeds: newest first

Upload both files to the repo's `api` folder, replacing the existing ones:

- `api/send-tenders.js`: each source (Find a Tender, Contracts Finder) now reads the last 90 days first, then the 3-year backfill resumes and skips those days. A "slow down" (429) from either service pauses that whole source.
- `api/send-market.js`: once the 90-day window is complete, "Notices read so far" shows the true up-to date, and the note says how far the older backfill has got.

No screen changes and no database changes. The cron (every 10 minutes) picks it up on the next run. Expect Find a Tender's last 90 days within about 3 hours, and Contracts Finder's within about 4 to 6 hours (it often asks Qura to slow down).
