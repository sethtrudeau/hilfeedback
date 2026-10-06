import { markAllRead } from "../actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatTime } from "@/lib/format";
import type { Notification } from "@/lib/types";
import { PageHead, StatusBadge } from "@/components/ui";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = db()
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100")
    .all(user.id) as Notification[];
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto flex max-w-(--w-prose) flex-col gap-6">
      <PageHead
        title="Notifications"
        subtitle={unread ? `${unread} unread.` : undefined}
        actions={
          unread > 0 && (
            <form action={markAllRead}>
              <button className="btn-secondary btn-sm">Mark all read</button>
            </form>
          )
        }
      />
      {notifications.length === 0 ? (
        <p className="text-sm">No notifications yet.</p>
      ) : (
        <ul className="overflow-hidden rounded-surface border border-outline bg-surface2">
          {notifications.map((n) => (
            <li key={n.id} className="border-outline not-first:border-t">
              <a
                href={`/notifications/${n.id}`}
                className="plain flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface1 focus-visible:bg-ink focus-visible:text-ink-inverse focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className={`mt-2 size-[7px] shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-ink"}`}
                />
                <span className="flex-1">
                  <span className={`block text-sm ${n.read ? "" : "font-medium"}`}>
                    {n.message}
                    {!n.read && <span className="sr-only"> (unread)</span>}
                  </span>
                  <span className="caption block">{formatTime(n.created_at)}</span>
                </span>
                {n.priority === "high" && <StatusBadge tone="info">Final project</StatusBadge>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
