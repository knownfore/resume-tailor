import { jsonError } from "@/lib/http";
import { requireUserFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req) {
  const session = await requireUserFromRequest(req);
  if (!session) return jsonError("Not authenticated.", 401);

  return Response.json(
    {
      user: {
        id: session.user.id,
        email: session.user.email
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
