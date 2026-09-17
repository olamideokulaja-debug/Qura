// The launch instant, shared.
//
// Must stay the same as LAUNCH_AT in api/_seed.js and LAUNCH_DATE in
// components/countdown.jsx. It lives in its own module because more than one
// screen needs it: the client had no idea the seeded content switches itself
// off, so anything that changes behaviour at launch reads it from here rather
// than keeping a second copy.
//
// Monday 21 September 2026, 00:00 UK time. September is BST, so UK midnight is
// 23:00 the previous day in UTC. Getting that wrong would switch the seeded
// content off an hour late, which is the kind of error nobody notices until a
// fictional role is still on the platform on launch morning.
export const LAUNCH_AT = Date.parse("2026-09-20T23:00:00Z");

// True while the pre-launch seeded content is still showing.
export const seedActive = () => Date.now() < LAUNCH_AT;

// Everything illustrative goes at the same instant: server-served seed records,
// the client-side demo arrays, and the pre-launch calls to action. One constant,
// so they cannot drift apart.
