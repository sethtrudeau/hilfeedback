import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Notification } from "@/lib/types";

// Marks a notification read and follows its link.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const n = db()
    .prepare("SELECT * FROM notifications WHERE id = ? AND user_id = ?")
    .get(Number((await params).id), user.id) as Notification | undefined;
  if (!n) redirect("/notifications");
  db().prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(n.id);
  redirect(n.link);
}
