import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "./actions";
import { currentUser } from "@/lib/auth";
import { pendingCount, unreadCount } from "@/lib/data";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flex Credit Feedback",
  description: "Formative AI feedback with a human in the loop for Flex Credit projects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user ? unreadCount(user.id) : 0;
  const nav =
    user?.role === "learner"
      ? [{ href: "/learner", label: "My projects" }]
      : user
        ? [
            { href: "/evaluator", label: "Learners" },
            { href: "/evaluator/pending", label: "Pending", count: pendingCount(user.id) },
          ]
        : [];

  return (
    <html lang="en">
      <head>
        {/* Neue Haas Grotesk Text (Adobe Fonts kit) and Phosphor icons, per the design system. */}
        <link rel="stylesheet" href="https://use.typekit.net/hku1ywo.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2/src/regular/style.css" />
      </head>
      <body>
        <header>
          <div className="page-bar flex min-h-16 flex-wrap items-center gap-x-8 gap-y-2 py-3">
            <Link href="/" className="plain flex items-center gap-3">
              <img src="/playlab-logo.svg" alt="Playlab" className="h-6 w-auto" />
              <span className="text-[13px] font-medium text-fg2">Flex Credit Feedback</span>
            </Link>
            {user && <NavLinks items={nav} />}
            {user && (
              <div className="ml-auto flex items-center gap-3">
                <Link href="/notifications" className="nav-item inline-flex items-center gap-1.5">
                  Notifications
                  {unread > 0 && <span className="count">{unread}</span>}
                </Link>
                <span className="meta">
                  {user.name}, {user.role}
                </span>
                <form action={logout}>
                  <button className="btn-ghost btn-sm">Log out</button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
