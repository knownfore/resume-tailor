import { getConfig } from "@/lib/config";
import { jsonError } from "@/lib/http";
import { createUser } from "@/lib/repository";
import { hashPassword } from "@/lib/security";
import { beginUserSession, buildSessionCookie } from "@/lib/session";
import { validateEmail, validatePassword } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const emailCheck = validateEmail(body?.email);
    const passwordCheck = validatePassword(body?.password);

    if (!emailCheck.ok) return jsonError(emailCheck.error, 400);
    if (!passwordCheck.ok) return jsonError(passwordCheck.error, 400);

    const config = getConfig();
    const passwordHash = hashPassword(passwordCheck.value);
    const created = await createUser(config, {
      email: emailCheck.value,
      passwordHash
    });

    if (!created.ok) {
      return jsonError(created.error, 409);
    }

    const session = await beginUserSession(created.user.id);

    return Response.json(
      {
        user: {
          id: created.user.id,
          email: created.user.email
        }
      },
      {
        status: 201,
        headers: {
          "Set-Cookie": buildSessionCookie(session.token, session.maxAgeSeconds),
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return jsonError(error?.message || "Registration failed.", 500);
  }
}
