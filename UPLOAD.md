# Update: SEND becomes a tab on the main site

The films and captions you uploaded are live and stay as they are. This update makes SEND a tab in the top navigation of the main site, at qurahealth.org/send, in place of the separate page.

## 1. Delete one file

In the repo, delete **`public/send-specialists.html`** (open it on GitHub, then the bin icon). The SEND tab replaces it.

## 2. Upload, replacing the existing files

| File | Folder | What changed |
|---|---|---|
| `vercel.json` | repo root | `/send` now serves the main site's SEND tab (`/send.html`, written by the build). The old redirect from `/send.html` into the app is removed so it doesn't clash; `/send-intelligence` still opens the SEND screen in the app. |
| `src/App.jsx` | `src` | A **SEND** tab in the top nav, between "Qura App" and "Fragile professions", plus "SEND Intelligence" in the footer. The new section has the hero ("Every special school. Every vacancy. Every morning."), the 62s film, the six feature cards, the Founding SEND Partner offer and "Built on public data". The landing film (92s) and the SEND film under the agency film are unchanged from the last upload. |
| `src/pages/agency.jsx` | `src/pages` | The SEND film's "See SEND Intelligence" button now opens the tab, and the button is hidden on the tab itself. |
| `src/data/seo.js` | `src/data` | A `/send` entry, so the tab gets its own title, description and link preview, and appears in the crawlable nav. |

`src/SendIntelligence.jsx` and the `public/` videos are already up and don't need re-uploading. Copies are in this folder for reference.

## After upload

Vercel rebuilds on its own. Then tell me and I'll check that:
- the SEND tab shows in the top nav and opens /send, with the film playing;
- /send loads directly, and shares with its own title;
- the For suppliers page and the landing film are unchanged.
