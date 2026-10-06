import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "./actions";
import { currentUser } from "@/lib/auth";
import { pendingCount, unreadCount } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flex Credit Feedback",
  description: "Formative AI feedback with a human in the loop for Flex Credit projects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user ? unreadCount(user.id) : 0;

  return (
    <html lang="en">
      <body>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="font-semibold text-teal-800">
              Flex Credit Feedback
            </Link>
            {user && (
              <nav className="flex gap-4 text-sm">
                {user.role === "learner" ? (
                  <Link href="/learner" className="link">
                    My projects
                  </Link>
                ) : (
                  <>
                    <Link href="/evaluator" className="link">
                      Learners
                    </Link>
                    <Link href="/evaluator/pending" className="link">
                      Pending ({pendingCount(user.id)})
                    </Link>
                  </>
                )}
              </nav>
            )}
            {user && (
              <div className="ml-auto flex items-center gap-4 text-sm">
                <Link href="/notifications" className="link">
                  Notifications
                  {unread > 0 && (
                    <span className="ml-1 rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">{unread}</span>
                  )}
                </Link>
                <span className="text-stone-600">
                  {user.name} · <span className="capitalize">{user.role}</span>
                </span>
                <form action={logout}>
                  <button className="text-stone-500 hover:text-stone-800">Log out</button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
