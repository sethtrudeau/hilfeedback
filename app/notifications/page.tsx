import { markAllRead } from "../actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTime } from "@/lib/format";
import type { Notification } from "@/lib/types";
import { Badge } from "@/components/ui";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = db()
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100")
    .all(user.id) as Notification[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <form action={markAllRead}>
            <button className="btn-secondary">Mark all read</button>
          </form>
        )}
      </div>
      {notifications.length === 0 && <p className="text-sm text-stone-500">No notifications yet.</p>}
      <ul className="card divide-y divide-stone-100 p-0">
        {notifications.map((n) => (
          <li key={n.id}>
            <a href={`/notifications/${n.id}`} className={`flex items-start gap-3 px-5 py-3 hover:bg-stone-50 ${n.read ? "text-stone-500" : ""}`}>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />}
              <span className="flex-1 text-sm">{n.message}</span>
              {n.priority === "high" && <Badge tone="amber">Important</Badge>}
              <span className="shrink-0 text-xs text-stone-400">{formatTime(n.created_at)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
