import { login } from "../actions";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const users = db().prepare("SELECT * FROM users ORDER BY role DESC, name").all() as User[];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="h1">Log in</h1>
      <form action={login} className="card space-y-3">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@school.org" />
        {error && <p className="text-sm text-rose-700">No account with that email.</p>}
        <button className="btn-primary w-full">Log in</button>
      </form>

      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-stone-600">Prototype accounts</h2>
        {users.map((u) => (
          <form key={u.id} action={login}>
            <input type="hidden" name="email" value={u.email} />
            <button className="btn-secondary w-full justify-between">
              <span>{u.name}</span>
              <span className="text-xs text-stone-500 capitalize">{u.role}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
