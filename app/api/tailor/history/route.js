import { getConfig } from "@/lib/config";
import { listRecentTailorings } from "@/lib/repository";

export const runtime = "nodejs";

export async function GET() {
  const config = getConfig();
  const rows = await listRecentTailorings(config);

  return Response.json(
    {
      history: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        resumeFileName: row.resumeFileName,
        resumeFormat: row.resumeFormat,
        resumeTailored: row.resumeTailored
      }))
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
