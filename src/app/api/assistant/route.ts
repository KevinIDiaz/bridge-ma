import { runAssistant } from "@/lib/assistant/orchestrator";
import { validateAssistantRequest } from "@/lib/assistant/validation";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = validateAssistantRequest(body);
  if (!input) return Response.json({ error: "invalid_request" }, { status: 400 });

  const turn = await runAssistant(input);
  return Response.json(turn, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

