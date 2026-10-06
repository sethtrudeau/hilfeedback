import { login } from "../actions";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";
import { Alert } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const users = db().prepare("SELECT * FROM users ORDER BY role DESC, name").all() as User[];

  return (
    <div className="mx-auto flex max-w-(--w-form) flex-col gap-6">
      <h1 className="h1">Log in</h1>
      <form action={login} className="card flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@school.org" />
        </div>
        {error && <Alert tone="error">There&apos;s no account with that email.</Alert>}
        <button className="btn-primary w-full">Log in</button>
      </form>

      <section className="card">
        <h2 className="eyebrow mb-1">Prototype accounts</h2>
        {users.map((u) => (
          <form key={u.id} action={login} className="row">
            <input type="hidden" name="email" value={u.email} />
            <div className="min-w-0 flex-1">
              <div className="text-sm">{u.name}</div>
              <div className="caption capitalize">{u.role}</div>
            </div>
            <button className="btn-secondary btn-sm">Log in</button>
          </form>
        ))}
      </section>
    </div>
  );
}
