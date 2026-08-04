"use client";

import { useActionState } from "react";
import { signIn, signInWithGoogle } from "../actions";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-[18px]">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7c4.1-3.8 6.6-9.4 6.6-16.1z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.7v5.6C8.3 41.3 15.6 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.9 28.5c-.4-1.3-.7-2.7-.7-4.5s.3-3.2.7-4.5v-5.6H4.7C3.1 17.1 2.2 20.4 2.2 24s.9 6.9 2.5 10.1l7.2-5.6z"
      />
      <path
        fill="#EA4335"
        d="M24 10.6c3.2 0 6 1.1 8.2 3.2l6.2-6.2C34.7 4.1 29.8 2 24 2 15.6 2 8.3 6.7 4.7 13.9l7.2 5.6c1.7-5.1 6.5-8.9 12.1-8.9z"
      />
    </svg>
  );
}

export default function LoginForm({ next, error }: { next: string; error?: string }) {
  const [state, formAction, pending] = useActionState(signIn, undefined);
  const [googleState, googleAction, googlePending] = useActionState(signInWithGoogle, undefined);

  const message = state?.error ?? googleState?.error ?? error;
  const busy = pending || googlePending;

  return (
    <>
      {message ? (
        <p className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{message}</p>
      ) : null}

      <form action={googleAction}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          disabled={busy}
          className="adm-btn adm-btn-ghost w-full justify-center gap-2.5 border border-slate-200"
        >
          <GoogleMark />
          {googlePending ? "Đang chuyển tới Google…" : "Đăng nhập bằng Google"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-[0.7rem] font-bold tracking-wide text-slate-400 uppercase">
        <span className="h-px flex-1 bg-slate-200" />
        hoặc
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={formAction}>
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

        <button type="submit" disabled={busy} className="adm-btn w-full justify-center">
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </>
  );
}
