"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <form action={formAction}>
      {state?.error ? (
        <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <input type="hidden" name="next" value={next} />

      <label className="adm-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="username" className="adm-input" />
      </label>

      <label className="adm-field">
        <span>Mật khẩu</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="adm-input"
        />
      </label>

      <button type="submit" disabled={pending} className="adm-btn w-full justify-center">
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
