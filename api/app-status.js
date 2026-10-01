import { getUser, kvListByKey } from "./_auth.js";
import { isFounderEmail } from "./_orgcheck.js";
import { noteAppBuild } from "./_appbuild.js";

// GET /api/app-status   founders only (1 October 2026)
//
// Answers "has it actually gone live?" for both halves of Qura:
//   web  the commit the website is running right now, from Vercel's own
//        system variables, so it is the code serving this very request
//   app  the newest update Expo is offering phones on the production channel,
//        and which update each signed-in app last reported running (see
//        api/_appbuild.js). A phone downloads a new update when the app opens
//        and switches to it the next time it opens.

const EXPO_PROJECT = "344879a8-ca22-4ce7-8bf0-6e8976ac900b";

async function latestUpdate(platform, runtime) {
  try {
    const r = await fetch("https://u.expo.dev/" + EXPO_PROJECT, {
      headers: {
        "expo-platform": platform,
        "expo-runtime-version": runtime,
        "expo-channel-name": "production",
        "expo-protocol-version": "1",
        accept: "multipart/mixed, application/expo+json, application/json",
      },
    });
    const text = await r.text();
    if (!r.ok) return { platform, runtime, error: "Expo answered " + r.status };
    // The answer is either plain JSON or a multipart body with the manifest as
    // its first JSON part.
    const start = text.indexOf("{\"id\"");
    const from = start >= 0 ? start : text.indexOf("{");
    let depth = 0, end = -1;
    for (let i = from; i < text.length && from >= 0; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") { depth--; if (!depth) { end = i + 1; break; } }
    }
    if (from < 0 || end < 0) return { platform, runtime, none: true };
    const m = JSON.parse(text.slice(from, end));
    return { platform, runtime, id: m.id || null, createdAt: m.createdAt || null };
  } catch (e) {
    return { platform, runtime, error: "Could not reach Expo" };
  }
}

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });
  await noteAppBuild(req, user);
  if (!isFounderEmail(user.email)) return res.status(403).json({ error: "Founders only." });

  const web = {
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
    message: (process.env.VERCEL_GIT_COMMIT_MESSAGE || "").split("\n")[0] || null,
    deploymentUrl: process.env.VERCEL_URL || null,
    environment: process.env.VERCEL_ENV || null,
  };

  const rows = await kvListByKey("app_build");
  const builds = {};
  const runtimes = new Set();
  for (const { value: b } of rows) {
    if (!b || !b.updateId) continue;
    const key = b.updateId + "|" + (b.platform || "");
    if (!builds[key]) builds[key] = { updateId: b.updateId, platform: b.platform || "", runtime: b.runtime || "", createdAt: b.createdAt || "", people: 0, lastSeen: "" };
    builds[key].people += 1;
    if ((b.seenAt || "") > builds[key].lastSeen) builds[key].lastSeen = b.seenAt || "";
    if (b.runtime && b.platform) runtimes.add(b.platform + "|" + b.runtime);
  }
  const offered = await Promise.all([...runtimes].slice(0, 6).map((k) => { const [p, rt] = k.split("|"); return latestUpdate(p, rt); }));
  const list = Object.values(builds).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  for (const b of list) {
    const o = offered.find((x) => x.platform === b.platform && x.runtime === b.runtime);
    b.isLatest = Boolean(o && o.id && o.id === b.updateId);
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ web, app: { offered, running: list, reporting: rows.length } });
}
