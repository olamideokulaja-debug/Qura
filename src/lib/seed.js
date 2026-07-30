// The same launch switch as the API, for the parts of the product whose figures
// are illustrative rather than measured.
//
// The dashboards, analytics and command centre charts are drawn from fixed
// example data, not from real trading. Until that reporting is connected to
// live activity, the figures must be labelled so nobody, inside the company or
// outside it, mistakes them for the marketplace's actual performance.

export const LAUNCH_AT = Date.parse("2026-09-22T08:00:00Z");

export function illustrativeFigures() {
  return true; // still example data; flip to a real check once reporting is live
}

export function beforeLaunch() {
  return Date.now() < LAUNCH_AT;
}
