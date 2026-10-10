# Update: the new clinician film on For clinicians

Replaces the August clinician film, which still said "we open on the twenty second of September", with the 56s rebuild that ends on the founding offer.

## Upload (add these, nothing to delete)

| File | Folder | What it is |
|---|---|---|
| `qura-clinician-film-56s.mp4` | `public` | The 56s film, 1080p, web-compressed (19 MB) |
| `qura-clinician-film-56s-subtitles.vtt` | `public` | Captions, on by default |
| `qura-clinician-film-56s-poster.jpg` | `public` | Poster: "You qualified to do the work." |
| `clinician.jsx` | `src/pages` | Replaces the existing file. The player now uses the three new files, and the line above it reads "56 seconds on why clinicians join Qura." |

The old `qura-clinician-film*.mp4/.vtt/.jpg` files can stay in `public` for now. Nothing links to them after this update, so they can be deleted later.

## After upload

Vercel rebuilds on its own. Tell me and I'll check that the For clinicians page plays the new film with captions and the new poster.
