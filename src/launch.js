// The launch instant, shared.
//
// Must stay the same as LAUNCH_AT in api/_seed.js. It lives in its own module
// because more than one screen needs it: the client had no idea the seeded
// content switches itself off, so anything that changes behaviour at launch
// reads it from here rather than keeping a second copy.
export const LAUNCH_AT = Date.parse("2026-09-22T08:00:00Z");

// True while the pre-launch seeded content is still showing.
export const seedActive = () => Date.now() < LAUNCH_AT;
