# Update: the new 2-minute platform demo

This replaces the 6-minute August demo. The new one plays in both places the old one did:
- **Book a demo → Watch the demo** on the site;
- **Watch the demo again** inside the app.

## Upload

| File | Folder | What it is |
|---|---|---|
| `qura-platform-demo-2026.mp4` | `public` | The demo, 1080p, web-compressed (29 MB) |
| `qura-platform-demo-2026-subtitles.vtt` | `public` | Captions, on by default |
| `App.jsx` | `src` | Replaces the existing file. The player uses the two new files, and captions are now on by default. The menu line changes from "Six minutes through the whole platform" to "Two minutes through the platform", and "Six minutes, on demand, no booking" becomes "Two minutes, on demand, no booking". |

Commit with **Commit changes**. GitHub should list `src/App.jsx` with 4 lines changed.

`App.jsx` was copied from GitHub just now and includes every earlier change. The old `public/qura-platform-demo.mp4` stays until you're happy, and nothing links to it after this update.

## After upload

Vercel rebuilds on its own. Then tell me and I'll check that Watch the demo plays the new film with captions.
