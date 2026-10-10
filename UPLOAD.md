# Update: remove the last "22 September" wording from the app

Upload `src/App.jsx`, replacing the existing file. Nothing else changes.

| Line | Was | Now |
|---|---|---|
| 409 | "Illustrative profiles, shown until launch on 22 September. Not real people or messages." | "Illustrative profiles, shown until real ones are here. Not real people or messages." |
| 4856 | "Organisation accounts open on 22 September, or sooner by requesting early access on the home page." | "Organisation accounts are opening shortly. Request early access on the home page." |

Both messages only appear under pre-launch conditions, so no visitor should see either one today. This removes the date in case either condition ever comes back.

This copy of App.jsx was taken from GitHub just now and includes every earlier change. Line 3999 ("Live since 22 September 2026") is correct and stays.
