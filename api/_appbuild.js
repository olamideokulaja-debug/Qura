// Which app update is each person actually running? (1 October 2026)
//
// App changes ship as over-the-air updates from Expo when code is pushed to
// qura-mobile. Expo's dashboard says an update was published; it cannot say
// whether phones picked it up. From this update on, the app sends three
// headers with its API calls:
//   x-qura-update-id       the update it is running ("embedded" = the store build)
//   x-qura-update-created  when that update was published
//   x-qura-runtime         the runtime version, which Expo matches updates to
//   x-qura-platform        ios or android
// They are recorded at kv(owner = the user, key = "app_build"), written only
// when they change, so this costs one read on the calls that use it.
// api/app-status.js turns them into a founders' view.

import { kvGet, kvSet } from "./_auth.js";

const clip = (v, n) => String(v == null ? "" : v).replace(/[^A-Za-z0-9:._+-]/g, "").slice(0, n);

export function buildFrom(req) {
  const h = (req && req.headers) || {};
  const id = clip(h["x-qura-update-id"], 64);
  if (!id) return null;
  return {
    updateId: id,
    createdAt: clip(h["x-qura-update-created"], 40),
    runtime: clip(h["x-qura-runtime"], 80),
    platform: clip(h["x-qura-platform"], 12),
  };
}

export async function noteAppBuild(req, user) {
  try {
    if (!user || !user.id || user._preview) return;
    const b = buildFrom(req);
    if (!b) return;
    const cur = await kvGet(user.id, "app_build");
    if (cur && cur.updateId === b.updateId && cur.platform === b.platform) return;
    await kvSet(user.id, "app_build", { ...b, seenAt: new Date().toISOString() });
  } catch (e) { /* never fails a request */ }
}
