# Upload to olamideokulaja-debug/Qura (main)

Upload in this order, so no page ever points at a file that isn't there yet. Use "Add file → Upload files" in each folder.

## 1. `public/` (12 files, 64 MB in all; the largest is 19.9 MB)

| File | Used by |
|---|---|
| `qura-every-lens-92s.mp4` (18.7 MB) · `qura-every-lens-92s-subtitles.vtt` | Landing page player |
| `qura-agency-film-66s.mp4` (18.5 MB) · `qura-agency-film-66s-subtitles.vtt` | For suppliers page, agency film |
| `qura-send-film.mp4` (19.9 MB) · `qura-send-film-subtitles.vtt` · `qura-send-film-poster.jpg` | For suppliers page (under the agency film) and the new `/send` page |
| `qura-send-upsell.mp4` (9.7 MB) · `qura-send-upsell-subtitles.vtt` · `qura-send-upsell-poster.jpg` | In-app SEND offer screen |
| `send-specialists.html` | The new public page at qurahealth.org/send |

Leave the existing files where they are: `qura-every-lens-88s.mp4`, `qura-agency-film.mp4` and their posters and captions are the fallback. The existing `qura-every-lens-poster.jpg` and `qura-agency-film-poster.jpg` are reused (both films still open on the same shot).

## 2. Root: `vercel.json`

Today's live file with one addition: a rewrite from `/send` to `/send-specialists.html`. Everything else (crons, the `/send-intelligence` and `/send.html` redirects into the app, the security headers) is unchanged.

## 3. `src/`

- **`src/App.jsx`**: today's live file with four changes:
  - The landing player plays `/qura-every-lens-92s.mp4` with the 92s captions.
  - The line above it reads "92 seconds on what Qura does for every lens, now with SEND Intelligence."
  - It imports `SendFilm` from `./pages/agency.jsx`.
  - It renders `<SendFilm />` under `<AgencyFilm />` on the For suppliers section.
- **`src/pages/agency.jsx`**:
  - The agency film is now the 66s cut, and its line reads "66 seconds on what Qura does for agencies." The Founding Partner button is unchanged.
  - It adds `SendFilm`: the 62s SEND film with "Place SEND staff? 62 seconds on SEND Intelligence." above it, and a "See SEND Intelligence" button linking to `/send`.
  - Both players share the same full-screen behaviour, and captions are on by default.
- **`src/SendIntelligence.jsx`**: today's live file with the 30s upsell film added at the top of the offer screen, the screen suppliers without SEND see. Nothing else changes.

## After upload

Vercel redeploys on its own. Then check:
1. **qurahealth.org:** the landing film is 1:32 and plays with captions.
2. **qurahealth.org/for-suppliers:** the agency film is 1:06; the SEND film sits under it, and its button opens `/send`.
3. **qurahealth.org/send:** the page loads, the film plays, and "Register your interest" opens the SEND screen in the app (sign-in first if needed).
4. **In the app:** as a supplier without SEND, open SEND Intelligence; the 30s film sits above the offer.

Tell me when it's up and I'll check the live pages.
