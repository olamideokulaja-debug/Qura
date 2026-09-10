// What a clinician profile still needs, and why it matters to them.
//
// The career-intent work gave clinicians somewhere to say what they want to do
// next. It did not give them any reason to. A profile with no target roles
// looks complete, matching quietly falls back to their current profession, and
// they never learn that the thing they came for is switched off.
//
// This is the prompt layer. Each item says what is missing, what it changes,
// and where to go. Nothing here is a nag: an item only appears when it would
// genuinely alter what the person is shown.
//
// The rule it holds to, which the rest of the platform holds to as well:
// COMPLETENESS IS NOT VERIFICATION. A full profile is a better profile, not a
// checked one. Nothing in this file may ever produce a badge.

export function profileGaps(profile, docs) {
  const p = profile || {};
  const gaps = [];

  const has = (v) => Array.isArray(v) ? v.length > 0 : Boolean(v);

  // The big one. Without it, matching runs on background alone, which is
  // exactly the failure a biomedical scientist targeting clinical research
  // reported: laboratory contracts, forever.
  if (!has(p.targetRoles)) {
    gaps.push({
      key: "targetRoles",
      label: "Tell us what you want to do next",
      why: "Right now we match you on what you are registered as. Set a target role and we match you on where you are going instead.",
      goTo: "profile",
      weight: 100,
    });
  }

  if (!has(p.markets) && !p.country) {
    gaps.push({
      key: "markets",
      label: "Add the countries you would work in",
      why: "We will only show you work you could actually take, and say plainly where you would need sponsorship.",
      goTo: "profile",
      weight: 70,
    });
  }

  // Only asked of people whose direction makes it relevant. Asking a locum
  // radiographer about trial phases is how a profile prompt becomes noise.
  const research = (Array.isArray(p.targetRoles) ? p.targetRoles : [])
    .some((r) => /research|trial|regulatory|pharmacovigilance|clinical data/i.test(String(r)));
  if (research && !(p.research && Object.keys(p.research).length)) {
    gaps.push({
      key: "research",
      label: "Add your clinical research experience",
      why: "CROs and sponsors read phases, therapeutic areas and monitoring experience rather than your registration.",
      goTo: "profile",
      weight: 60,
    });
  }

  const held = new Set((Array.isArray(docs) ? docs : []).map((d) => d && d.type).filter(Boolean));

  // Only where it is the route they are actually on. Someone verified on a
  // register does not need to be chased for a qualification certificate.
  if (p.verificationRoute === "credentials") {
    if (!held.has("identity")) {
      gaps.push({
        key: "identity",
        label: "Add an identity document",
        why: "You told us you do not hold a professional registration. Identity is the first of the three checks that replace a register lookup.",
        goTo: "vault",
        weight: 90,
      });
    }
    if (!held.has("qualification")) {
      gaps.push({
        key: "qualification", label: "Add your main qualification",
        why: "We confirm it directly with the awarding institution.",
        goTo: "vault", weight: 85,
      });
    }
    if (!held.has("research-certification") && !held.has("training")) {
      gaps.push({
        key: "certification", label: "Add a current certification",
        why: "GCP or an equivalent, confirmed with the body that issued it.",
        goTo: "vault", weight: 80,
      });
    }
  }

  return gaps.sort((a, b) => b.weight - a.weight);
}

/**
 * How complete is this profile, and is it verified?
 *
 * Two separate numbers on purpose. They were conflated once already, in a
 * screen that said "You are registered on Qura" under a shield tick before
 * anyone had checked anything, and that is the mistake this signature is shaped
 * to prevent.
 */
export function profileState(profile, docs) {
  const gaps = profileGaps(profile, docs);
  const total = 5;
  const done = Math.max(0, total - gaps.length);
  return {
    completeness: Math.round((done / total) * 100),
    gaps,
    // Verification comes from a person having checked, and from nowhere else.
    verified: Boolean(profile && profile.verifiedAt),
    label: profile && profile.verifiedAt ? "Qura Verified" : "Profile active",
  };
}
