import { getUser, kvGet, kvSet } from "./_auth.js";

// Qura Academy certificates.
//
// Two jobs, and they are deliberately different shapes:
//
//   GET /api/certificate?course=<id>   authenticated. Returns the data needed
//                                      to render this person's certificate.
//   GET /api/certificate?verify=<id>   PUBLIC, no auth. Confirms a credential
//                                      is real and says who it belongs to.
//
// The second one is the point. A certificate nobody can check is decoration; a
// certificate with a QR code that resolves to Qura confirming "yes, this is
// real, issued to this person on this date" is a credential. That is why the
// verify route is open and returns only what a verifier needs.

const COURSE_NAMES = {
  "essentials": "Qura Essentials",
  "career-ready": "Career Ready",
  "provider-certified": "Provider Certified",
  "supplier-certified": "Supplier Certified",
  "qbd": "Qura Qualified Healthcare BD Consultant",
};

const COURSE_STRAPLINE = {
  "essentials": "Understand the Platform. Unlock Opportunities. Drive Results.",
  "career-ready": "Build Your Profile. Get Discovered. Win the Right Work.",
  "provider-certified": "Evaluate Suppliers. Buy Well. Protect Your Service.",
  "supplier-certified": "Win Opportunities. Build Credibility. Grow Your Business.",
  "qbd": "The QURA Method. Healthcare Business Development, Qualified.",
};

const keyFor = (courseId) => "academy_" + courseId;

// Public index of issued credentials, so verification does not need to know
// whose account a credential belongs to before it can look it up.
const INDEX = "academy_credentials";

async function indexCredential(entry) {
  try {
    const cur = (await kvGet("shared", INDEX)) || {};
    const map = cur && typeof cur === "object" && !Array.isArray(cur) ? cur : {};
    if (!map[entry.credentialId]) {
      map[entry.credentialId] = entry;
      await kvSet("shared", INDEX, map);
    }
  } catch (e) {
    // Indexing is a convenience. Never fail a certificate because of it.
    console.error("[certificate] index write failed: " + (e && e.message));
  }
}

export default async function handler(req, res) {
  const q = req.query || {};

  // ---------------------------------------------------------- verification
  // Open on purpose: a hiring manager holding a printed certificate has no
  // Qura account. Returns nothing beyond what is on the certificate itself.
  if (q.verify) {
    const id = String(q.verify).trim().toUpperCase().slice(0, 40);
    let map = {};
    try { map = (await kvGet("shared", INDEX)) || {}; } catch (e) {}
    const hit = map && map[id];
    res.setHeader("Cache-Control", "public, max-age=60");
    if (!hit) {
      return res.status(200).json({
        valid: false,
        message: "No Qura credential with that ID. Check the ID, or ask the holder for a fresh copy.",
      });
    }
    return res.status(200).json({
      valid: true,
      credentialId: id,
      name: hit.name || "",
      course: hit.course || "",
      courseId: hit.courseId || "",
      issuedAt: hit.issuedAt || "",
      score: typeof hit.score === "number" ? hit.score : null,
      message: "This is a genuine Qura Academy credential.",
    });
  }

  // ------------------------------------------------------- the holder's own
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  const courseId = String(q.course || "");
  if (!COURSE_NAMES[courseId]) return res.status(400).json({ error: "Unknown course." });

  const prog = (await kvGet(user.id, keyFor(courseId))) || {};
  if (!prog.passedAt || !prog.credentialId) {
    return res.status(403).json({ error: "This course has not been passed yet." });
  }

  // The name on a certificate should be the person's real name, not an email
  // stem. Falls back sensibly rather than printing something embarrassing.
  const meta = user.user_metadata || {};
  const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim()
    || meta.full_name || meta.name
    || (user.email ? user.email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Qura Member");

  const entry = {
    credentialId: prog.credentialId,
    name,
    course: COURSE_NAMES[courseId],
    courseId,
    issuedAt: prog.passedAt,
    score: typeof prog.lastScore === "number" ? prog.lastScore : null,
  };
  await indexCredential(entry);

  return res.status(200).json({
    ...entry,
    strapline: COURSE_STRAPLINE[courseId] || "",
    verifyUrl: "https://www.qurahealth.org/verify?id=" + encodeURIComponent(prog.credentialId),
  });
}
