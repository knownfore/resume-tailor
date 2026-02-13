import { getConfig } from "@/lib/config";
import { jsonError } from "@/lib/http";
import { findUserByEmail } from "@/lib/repository";
import { verifyPassword } from "@/lib/security";
import { beginUserSession, buildSessionCookie } from "@/lib/session";
import { validateEmail, validatePassword } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const emailCheck = validateEmail(body?.email);
    const passwordCheck = validatePassword(body?.password);

    if (!emailCheck.ok) return jsonError("Invalid email or password.", 401);
    if (!passwordCheck.ok) return jsonError("Invalid email or password.", 401);

    const config = getConfig();
    const user = await findUserByEmail(config, emailCheck.value);
    if (!user) return jsonError("Invalid email or password.", 401);

    if (!verifyPassword(passwordCheck.value, user.passwordHash)) {
      return jsonError("Invalid email or password.", 401);
    }

    const session = await beginUserSession(user.id);

    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email
        }
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": buildSessionCookie(session.token, session.maxAgeSeconds),
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    return jsonError(error?.message || "Login failed.", 500);
  }
}
