import { getUser } from "./_auth.js";
import { owners } from "./_waitlist.js";

// Who may run a scheduled job: Vercel Cron (which sends the CRON_SECRET as a
// bearer token), or a signed-in founder re-running it by hand. Anyone else is
// refused. Fails closed: with no CRON_SECRET set, only a founder can run it.
// Added in the 25 September security review, after finding that several jobs
// (the weekly digest email among them) could be started by anyone.
export async function cronAllowed(req) {
  const secret = process.env.CRON_SECRET || "";
  const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const key = String((req.query && req.query.key) || "");
  if (secret && (auth === secret || key === secret)) return true;
  try {
    const user = await getUser(req);
    if (user && !user._preview && owners().includes(String(user.email || "").toLowerCase())) return true;
  } catch (e) {}
  return false;
}
