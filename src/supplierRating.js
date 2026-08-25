// The Qura Supplier Rating.
//
// One definition, shared by the API and the screens, so a rating shown to a
// hospital can never disagree with the rating stored against the supplier.
//
// The design principle is the same one that governs clinician verification:
// a score is only worth something if it is earned against a checkable fact.
// The old AGENCIES data carried ratings like 4.9 and 4.8 that were invented.
// Nothing here is invented — every point traces to something a founder has
// confirmed, a supplier has evidenced, or a provider has actually reported.
//
// Two sources, kept separate on purpose:
//
//   EARNED     objective standing: verification, framework, CQC, coverage,
//              responsiveness. Available from day one, no reviews needed.
//   REPORTED   what providers say after working with them. Worth more, but
//              only once there are enough of them to mean anything.
//
// Until a supplier has REVIEW_FLOOR provider ratings, the score shown is the
// earned one and is labelled as such. A single five-star review from a friendly
// customer must never outweigh the objective picture.

export const REVIEW_FLOOR = 3;

// Each signal, what it is worth, and the plain-English reason shown to a
// hospital. The reason matters as much as the number: an unexplained star
// rating is indistinguishable from an invented one.
export const SIGNALS = [
  { key: "quraVerified", points: 1.4, label: "Qura Verified",
    why: "A founder has checked this supplier's registration and credentials." },
  { key: "framework", points: 1.0, label: "Framework approved",
    why: "Holds a place on a recognised NHS or public sector framework." },
  { key: "cqc", points: 0.7, label: "CQC registered",
    why: "Registered with the Care Quality Commission." },
  { key: "specialtiesEvidenced", points: 0.5, label: "Specialties evidenced",
    why: "Has declared and evidenced three or more clinical specialties." },
  { key: "regionsCovered", points: 0.4, label: "Regional coverage",
    why: "Covers more than one region and has said which." },
  { key: "respondsFast", points: 0.5, label: "Responds quickly",
    why: "Replies to Qura introductions within two working days." },
  { key: "compliancePack", points: 0.5, label: "Compliance pack complete",
    why: "Insurance, right to work and safeguarding documentation on file." },
];

// Being on Qura at all is worth something, but only a little. A supplier that
// has done nothing beyond signing up should not look like a safe choice.
const BASE = 1.0;

const has = (s, k) => Boolean(s && s[k]);

export function earnedRating(supplier) {
  const met = SIGNALS.filter((sig) => has(supplier, sig.key));
  const raw = BASE + met.reduce((n, sig) => n + sig.points, 0);
  const stars = Math.min(5, Math.round(raw * 2) / 2);   // half stars
  return {
    stars,
    met: met.map((sig) => ({ key: sig.key, label: sig.label, why: sig.why })),
    missing: SIGNALS.filter((sig) => !has(supplier, sig.key))
      .map((sig) => ({ key: sig.key, label: sig.label, why: sig.why, points: sig.points })),
  };
}

// Providers rate out of 5 after an engagement. Averaged plainly — no weighting
// by recency or account size, because either would be a thumb on the scale that
// a hospital cannot see.
export function reportedRating(reviews) {
  const list = Array.isArray(reviews) ? reviews.filter((r) => typeof r.stars === "number") : [];
  if (!list.length) return { stars: null, count: 0 };
  const avg = list.reduce((n, r) => n + r.stars, 0) / list.length;
  return { stars: Math.round(avg * 10) / 10, count: list.length };
}

/**
 * The rating a hospital sees.
 *
 * @param supplier  the supplier record, carrying the boolean signals above
 * @param reviews   provider ratings, if any
 * @param override  { stars, note, by, at } set by a founder. Used sparingly and
 *                  always shown as a founder assessment rather than passed off
 *                  as earned or reported.
 */
export function quraRating(supplier, reviews, override) {
  const earned = earnedRating(supplier);
  const reported = reportedRating(reviews);

  if (override && typeof override.stars === "number") {
    return {
      stars: Math.min(5, Math.max(0, override.stars)),
      basis: "founder",
      label: "Qura assessment",
      explain: override.note || "Assessed directly by the Qura team.",
      earned, reported, override,
    };
  }

  if (reported.count >= REVIEW_FLOOR) {
    // Blended once there is enough provider evidence to carry weight: the
    // objective picture still counts, because a supplier can be well liked and
    // still hold none of the credentials a hospital needs.
    const blended = Math.round(((reported.stars * 0.6) + (earned.stars * 0.4)) * 2) / 2;
    return {
      stars: Math.min(5, blended),
      basis: "blended",
      label: "Provider rated",
      explain: reported.count + " provider" + (reported.count === 1 ? "" : "s") +
        " have rated this supplier, combined with their verified standing on Qura.",
      earned, reported,
    };
  }

  return {
    stars: earned.stars,
    basis: "earned",
    label: "Verified standing",
    explain: reported.count
      ? "Based on verified standing. " + reported.count + " provider rating so far, too few to show separately."
      : "Based on verified standing. No provider ratings yet.",
    earned, reported,
  };
}
