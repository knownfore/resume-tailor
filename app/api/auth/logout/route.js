import { buildLogoutCookie, endUserSession, requireUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req) {
  const session = await requireUserFromRequest(req);
  if (session?.token) {
    await endUserSession(session.token);
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": buildLogoutCookie(),
        "Cache-Control": "no-store"
      }
    }
  );
}
