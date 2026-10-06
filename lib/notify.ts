import { db } from "./db";
import type { Notification } from "./types";

export function notify(
  userId: number,
  type: string,
  message: string,
  link: string,
  priority: Notification["priority"] = "normal",
) {
  db().prepare(
    "INSERT INTO notifications (user_id, type, message, link, priority) VALUES (?, ?, ?, ?, ?)",
  ).run(userId, type, message, link, priority);
}
