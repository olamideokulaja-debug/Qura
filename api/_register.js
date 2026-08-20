// One place that assembles the register.
//
// Before this, contacts.js merged the researched file with manual additions and
// notice-harvested people, while contacts-export.js read the researched file
// alone — so the CSV a subscriber downloaded held fewer people than the screen
// they downloaded it from. Both now call buildRegister().
//
// It also does the enrichment: when a tender names someone already in the
// register, their published email or phone fills whatever the register is
// missing, instead of the harvested copy being thrown away.

// Names arrive with titles and post-nominals that differ between sources:
// "Dr Catherine McDougall", "Catherine McDougall", "Gianrico Farrugia, MD".
// Matching on the raw string would treat those as three different people.
export function normName(s) {
  return String(s || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(dr|mr|mrs|ms|miss|prof|professor|a\/prof|assoc\.? prof)\.?\s+/i, "")
    .replace(/,?\s*\b(md|do|rn|phd|mba|msn|dnp|pa-c|np|frcp|frcs|mrcp|facs|fache)\b\.?/gi, "")
    .replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
}

// Organisation strings vary more than names. Kept deliberately light: an
// aggressive normaliser would merge "Barts Health NHS Trust" with "Barts Health
// NHS Foundation Trust", which are sometimes genuinely different bodies.
export function normOrg(s) {
  return String(s || "").toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(ltd|limited|plc|inc|llc)\b\.?/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

const clean = (v) => {
  const s = String(v == null ? "" : v).trim();
  return s && s.toLowerCase() !== "null" ? s : "";
};

/**
 * @param base          researched register (CONTACTS)
 * @param added         manual additions from kv
 * @param harvested     people named on procurement notices
 * @returns { list, enrichedCount, harvestedNew }
 */
export function buildRegister(base, added, harvested) {
  const list = [...(added || []), ...(base || [])].map((c) => ({ ...c }));

  // Two indexes. Email is the stronger signal: the same person can be written
  // three ways across sources, but an address is an address.
  const byEmail = new Map();
  const byNameOrg = new Map();
  for (const c of list) {
    const e = clean(c.email).toLowerCase();
    if (e && !byEmail.has(e)) byEmail.set(e, c);
    const k = normName(c.name) + "|" + normOrg(c.org);
    if (!byNameOrg.has(k)) byNameOrg.set(k, c);
  }

  let enrichedCount = 0;
  const fresh = [];

  for (const h of (harvested || [])) {
    const hEmail = clean(h.email).toLowerCase();
    let match = (hEmail && byEmail.get(hEmail)) ||
                byNameOrg.get(normName(h.name) + "|" + normOrg(h.org));

    // Portals write the same body several ways. "NHS South East London
    // Integrated Care Board" and "...Integrated Care Board London" produced two
    // Khadijah Yasmins with different addresses. Where the NAME matches exactly
    // and one organisation string contains the other, treat it as one person.
    // Containment rather than fuzziness, so "Barts Health NHS Trust" is never
    // merged with "Barts Health NHS Foundation Trust".
    if (!match) {
      const hn = normName(h.name), ho = normOrg(h.org);
      for (const [k, c] of byNameOrg) {
        const cut = k.indexOf("|");
        if (k.slice(0, cut) !== hn) continue;
        const co = k.slice(cut + 1);
        if (co && ho && (co.startsWith(ho) || ho.startsWith(co))) { match = c; break; }
      }
    }

    if (!match) {
      fresh.push(h);
      // Index it so a second notice naming the same person enriches this new
      // record rather than adding them again.
      const k = normName(h.name) + "|" + normOrg(h.org);
      if (!byNameOrg.has(k)) byNameOrg.set(k, h);
      if (hEmail && !byEmail.has(hEmail)) byEmail.set(hEmail, h);
      continue;
    }

    // Fill blanks only. A researched detail is never overwritten by a
    // harvested one: the notice may be years old or name a shared inbox.
    const filled = [];
    if (!clean(match.email) && clean(h.email)) { match.email = h.email; filled.push("email"); }
    if (!clean(match.phone) && clean(h.phone)) { match.phone = h.phone; filled.push("phone"); }
    // A fuller job title is worth taking; a shorter one is not.
    if (clean(h.role) && clean(h.role).length > clean(match.role).length + 4 &&
        clean(match.role).toLowerCase() !== clean(h.role).toLowerCase()) {
      match.role = h.role; filled.push("role");
    }

    // Seen on a notice, whether or not anything was filled. That is worth
    // knowing on its own: it means this person is currently buying.
    match.noticeCount = (match.noticeCount || 0) + (h.noticeCount || 1);
    match.lastNotice = h.lastNotice || h.sourceUrl || match.lastNotice || null;
    match.lastSeenAt = h.lastSeenAt || match.lastSeenAt || null;

    if (filled.length) {
      match.enrichedFields = Array.from(new Set([...(match.enrichedFields || []), ...filled]));
      match.enrichedFrom = h.source || match.enrichedFrom || null;
      match.enrichedAt = h.lastSeenAt || new Date().toISOString().slice(0, 10);
      enrichedCount++;
    }
  }

  return { list: [...list, ...fresh], enrichedCount, harvestedNew: fresh.length };
}
