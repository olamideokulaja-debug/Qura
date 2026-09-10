// Canonical organisation identity.
//
// Qura already knows about the same organisation in four places and none of
// them agree:
//
//   a procurement notice's buyer      "Guy's & St Thomas' NHS Foundation Trust"
//   a register contact's org          "Guys and St Thomas NHS FT"
//   a CRM client record               "Guy's & St Thomas'"
//   a supplier's organisation claim    whatever they typed
//
// So the supplier journey breaks at the first step. A demand signal cannot lead
// to the decision-makers at that organisation, because nothing knows they are
// the same organisation.
//
// This resolves all four to one key. It does NOT create a new organisation
// table or migrate anything: it is a pure function, so existing records keep
// their own text and simply gain a way to be matched.

// Words that carry no identifying information in an organisation name. Removing
// them is what lets the four spellings above collapse to one key.
const NOISE = [
  "nhs", "foundation", "trust", "ft", "the", "and", "of",
  "hospital", "hospitals", "healthcare", "health", "care",
  "board", "authority", "partnership", "group", "services", "service",
  "ltd", "limited", "llp", "plc", "inc", "corporation", "company", "co",
  "university", "teaching", "integrated", "system", "icb", "ccg",
];

const AMP = /\s*&\s*/g;

/**
 * A stable key for an organisation name.
 *
 * Deliberately lossy: "Guy's & St Thomas' NHS Foundation Trust" and "Guys and
 * St Thomas NHS FT" both become "guysstthomas".
 */
export function orgKey(name) {
  const raw = String(name || "").toLowerCase();
  if (!raw.trim()) return "";
  return raw
    .replace(AMP, " and ")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && NOISE.indexOf(w) < 0)
    .join("")
    .slice(0, 60);
}

/**
 * Are these certainly the same organisation?
 *
 * Exact key match only. An earlier version also matched on prefix, so that
 * "barts" caught "bartsradiology" — but it equally matched Leeds Teaching
 * against Leeds Community, which are different trusts, and Manchester
 * University against Manchester Royal Infirmary.
 *
 * Putting a supplier in front of the wrong trust is worse than missing a link,
 * so anything less than certain is a suggestion for a person to confirm.
 */
export function sameOrg(a, b) {
  const ka = orgKey(a);
  const kb = orgKey(b);
  return Boolean(ka) && ka === kb;
}

/**
 * Might these be the same organisation, or one a division of the other?
 *
 * For SUGGESTING a link to a human, never for joining records. Returns a reason
 * so the interface can say why it thinks so rather than asserting it.
 */
export function relatedOrg(a, b) {
  const ka = orgKey(a);
  const kb = orgKey(b);
  if (!ka || !kb || ka === kb) return null;
  const shorter = ka.length <= kb.length ? ka : kb;
  const longer = ka.length <= kb.length ? kb : ka;
  if (shorter.length >= 5 && longer.indexOf(shorter) === 0) {
    return { confident: false, reason: "One name starts with the other, so this may be the same organisation or a division of it." };
  }
  return null;
}

/**
 * The supplier journey, as one shape.
 *
 * Demand signal -> organisation -> decision makers -> opportunity -> action.
 * Everything here comes from records that already exist; this only joins them,
 * which is the whole point. Rebuilding any of it would be the wrong answer.
 */
export function assembleSignal(notice, contacts, opportunities) {
  const key = orgKey(notice && notice.buyer);
  if (!key) return null;

  const people = (Array.isArray(contacts) ? contacts : [])
    .filter((c) => sameOrg(c.org, notice.buyer));

  const related = (Array.isArray(opportunities) ? opportunities : [])
    .filter((o) => o.id !== notice.id && sameOrg(o.buyer || o.employer, notice.buyer));

  // Organisations we are less sure about, offered for a person to confirm
  // rather than silently folded in.
  const maybe = (Array.isArray(contacts) ? contacts : [])
    .filter((c) => !sameOrg(c.org, notice.buyer) && relatedOrg(c.org, notice.buyer))
    .slice(0, 4);

  return {
    orgKey: key,
    organisation: notice.buyer,
    signal: notice,
    // Named people first: a shared mailbox is a last resort, not a lead.
    decisionMakers: people.sort((a, b) => (isPerson(b.name) ? 1 : 0) - (isPerson(a.name) ? 1 : 0)).slice(0, 8),
    possiblyRelated: maybe,
    alsoBuying: related.slice(0, 5),
    // One obvious next action, chosen from what this account may actually do.
    // Offering four equal buttons is how an intelligence screen becomes a
    // dead end.
    nextAction: people.length
      ? { kind: "contact", label: "Contact " + people[0].name, target: people[0] }
      : { kind: "open", label: "Open the notice", target: notice.url || null },
  };
}

// A shared inbox is not a person. Used for ordering rather than filtering,
// because a departmental address is still worth having when nothing else is.
export function isPerson(name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return false;
  if (/^(procurement|contracting|purchasing|tender|admin|info|enquiries)\b/.test(n)) return false;
  if (/(contact|team|department|enquiries|mailbox|helpdesk|office)$/.test(n)) return false;
  return n.split(/\s+/).length >= 2;
}
