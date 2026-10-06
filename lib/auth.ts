import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role, User } from "./types";

// Prototype auth (PRD R1): the session cookie is just the user id of a seeded account.
export const SESSION_COOKIE = "uid";

export async function currentUser(): Promise<User | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return (db().prepare("SELECT * FROM users WHERE id = ?").get(Number(id)) as User | undefined) ?? null;
}

export async function requireUser(role?: Role): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect("/");
  return user;
}
