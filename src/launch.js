// The launch instant, shared.
//
// Must stay the same as LAUNCH_AT in api/_seed.js. The countdown component
// imports this rather than keeping its own copy, so the three can no longer
// drift apart. They had: the countdown said one time while the switch said
// another.
//
// 22 September 2026, 09:00 UK time. September is BST, so 09:00 UK is 08:00 UTC.
// Getting the offset wrong would switch the seeded content an hour out, which
// is the kind of error nobody notices until a fictional role is still on the
// platform after launch.
export const LAUNCH_AT = Date.parse("2026-09-22T08:00:00Z");

// True while the pre-launch seeded content is still showing.
export const seedActive = () => Date.now() < LAUNCH_AT;

// Everything illustrative goes at the same instant: server-served seed records,
// the client-side demo arrays, and the pre-launch calls to action. One constant,
// so they cannot drift apart.
