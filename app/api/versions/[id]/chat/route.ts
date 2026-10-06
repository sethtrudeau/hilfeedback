import { currentUser } from "@/lib/auth";
import { getProjectFor, getVersion } from "@/lib/data";
import { continueFeedback, ensureInitialFeedback } from "@/lib/feedback";

// Gives the initial AI feedback for a version (empty body) or continues the chat ({ message }).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== "learner") return Response.json({ error: "Not allowed." }, { status: 403 });

  const version = getVersion(Number((await params).id));
  const project = version && getProjectFor(user, version.project_id);
  if (!version || !project) return Response.json({ error: "Not found." }, { status: 404 });
  if (!version.ai_reviewable) {
    return Response.json({ error: "This artifact is reviewed by a person, not the AI." }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { message?: string };
  const message = body.message?.trim();
  if (message && project.status !== "Active") {
    return Response.json({ error: "This project is submitted, so the chat is closed." }, { status: 400 });
  }

  try {
    const turns = message ? await continueFeedback(version.id, message) : await ensureInitialFeedback(version.id);
    return Response.json({ turns });
  } catch (err) {
    console.error("AI feedback failed:", err);
    return Response.json({ error: err instanceof Error ? err.message : "AI feedback failed." }, { status: 502 });
  }
}
