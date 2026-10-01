// Compensation and employment preferences (1 October 2026, "Permanent First").
//
// Qura is permanent first, not permanent only. A clinician says which kinds of
// work they want, gives an annual salary expectation as the main figure, and
// can add an expected day rate for locum, bank, contract or insourcing work.
//
// Salary and day rate are separate fields and never share storage:
//   salaryBand        the key of the band they picked (below)
//   salaryMin/Max     the band's range in whole pounds (Max null = no ceiling)
//   salaryCurrency    "GBP"
//   salaryPeriod      "year"
//   salaryNegotiable  true when they picked "Negotiable"
//   dayRate           unchanged from before: a whole number of pounds a day
//   employmentPreferences  any of PREF_KEYS, Permanent first
//
// A day rate is never required, so someone who only wants permanent work never
// has to enter one. The bands live here and the app reads them from
// GET /api/profile, so changing a band is a one-file change with no app release.

export const SALARY_BANDS = [
  { key: "under_25", label: "Under £25k", min: 0, max: 25000 },
  { key: "25_30", label: "£25k to £30k", min: 25000, max: 30000 },
  { key: "30_35", label: "£30k to £35k", min: 30000, max: 35000 },
  { key: "35_40", label: "£35k to £40k", min: 35000, max: 40000 },
  { key: "40_45", label: "£40k to £45k", min: 40000, max: 45000 },
  { key: "45_50", label: "£45k to £50k", min: 45000, max: 50000 },
  { key: "50_60", label: "£50k to £60k", min: 50000, max: 60000 },
  { key: "60_70", label: "£60k to £70k", min: 60000, max: 70000 },
  { key: "70_80", label: "£70k to £80k", min: 70000, max: 80000 },
  { key: "80_100", label: "£80k to £100k", min: 80000, max: 100000 },
  { key: "100_125", label: "£100k to £125k", min: 100000, max: 125000 },
  { key: "125_plus", label: "£125k+", min: 125000, max: null },
  { key: "negotiable", label: "Negotiable", min: null, max: null, negotiable: true },
];

export const PREFS = [
  { key: "permanent", label: "Permanent" },
  { key: "fixed_term", label: "Fixed-term" },
  { key: "locum_bank", label: "Locum / Bank" },
  { key: "contract_insourcing", label: "Contract / Insourcing" },
];
export const PREF_KEYS = PREFS.map((p) => p.key);
// Preferences where a day rate is the usual way to be paid.
export const DAY_RATE_PREFS = ["locum_bank", "contract_insourcing"];

export const bandOf = (key) => SALARY_BANDS.find((b) => b.key === key) || null;
export const bandLabel = (key) => { const b = bandOf(key); return b ? b.label : ""; };

// Cleans the compensation fields on a profile in place. `incoming` is the
// request body and `current` what is stored; a field missing from the request
// keeps its stored value, an unknown band is ignored, and an empty string or
// null clears it.
export function cleanComp(clean, incoming, current) {
  const pick = (k) => (incoming[k] !== undefined ? incoming[k] : current[k]);

  // An unknown band (an old or mistyped key) keeps what is stored rather than
  // wiping it; an empty string or null clears it on purpose.
  let band = pick("salaryBand");
  if (band && !bandOf(String(band))) band = current.salaryBand;
  for (const k of ["salaryBand", "salaryMin", "salaryMax", "salaryCurrency", "salaryPeriod", "salaryNegotiable"]) delete clean[k];
  const b = band ? bandOf(String(band)) : null;
  if (b) {
    clean.salaryBand = b.key;
    clean.salaryMin = b.min;
    clean.salaryMax = b.max;
    clean.salaryCurrency = "GBP";
    clean.salaryPeriod = "year";
    clean.salaryNegotiable = Boolean(b.negotiable);
  }

  const prefs = pick("employmentPreferences");
  delete clean.employmentPreferences;
  if (Array.isArray(prefs)) {
    // Kept in the fixed order, Permanent first, whatever order they arrive in.
    const want = new Set(prefs.map((x) => String(x)));
    const list = PREF_KEYS.filter((k) => want.has(k));
    if (list.length) clean.employmentPreferences = list;
  }
  return clean;
}

// Does the clinician's salary expectation sit inside a vacancy's range?
// Negotiable or not given counts as a possible match; nobody is ruled out on
// salary alone.
export function salaryFit(p, min, max) {
  if (!p || !p.salaryBand || p.salaryNegotiable) return "open";
  const lo = Number(p.salaryMin || 0), hi = p.salaryMax == null ? Infinity : Number(p.salaryMax);
  const vmin = min == null || min === "" ? 0 : Number(min), vmax = max == null || max === "" ? Infinity : Number(max);
  if (!isFinite(vmin) && !isFinite(vmax)) return "open";
  return lo < vmax && hi > vmin ? "overlap" : "outside";
}

// What a GET returns so the app can draw the form without hard-coding bands.
export const compOptions = () => ({
  salaryBands: SALARY_BANDS.map(({ key, label }) => ({ key, label })),
  employmentPreferences: PREFS,
});
