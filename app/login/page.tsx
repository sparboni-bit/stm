import Image from "next/image"
import Link from "next/link"

import { loginAction, signupAction } from "@/modules/auth/actions"

type LoginPageProps = {
  searchParams?: Promise<{
    mode?: string
    error?: string
    message?: string
  }>
}

function getErrorMessage(error?: string) {
  if (!error) return null

  const messages: Record<string, string> = {
    missing_credentials: "Enter email and password.",
    login_failed: "Login failed.",
    missing_fields: "Complete all fields.",
    passwords_do_not_match: "Passwords do not match.",
    password_too_short: "Password must contain at least 8 characters.",
    signup_failed: "Sign up failed.",
    no_active_member:
      "Login succeeded, but you are not an active member of any organization.",
    no_active_workspace:
      "Login succeeded, but no active workspace is available.",
  }

  return messages[error] || decodeURIComponent(error)
}

function getInfoMessage(message?: string) {
  if (message === "check_email") {
    return "Registration complete. Check your email to confirm your account."
  }
  return null
}

const inputClass =
  "min-h-[46px] rounded-[11px] border border-slate-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-slate-400 focus:border-neutral-950"

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams
  const mode = params?.mode === "signup" ? "signup" : "login"
  const errorMessage = getErrorMessage(params?.error)
  const infoMessage = getInfoMessage(params?.message)

  return (
    <main className="min-h-screen bg-white px-4 py-10 sm:flex sm:items-center sm:justify-center sm:py-12">
      <section className="mx-auto w-full max-w-[380px]">
        <div className="text-center">
          <Image
            src="/brand/pickleball-arena-logo2.png"
            alt="Pickleball Arena"
            width={190}
            height={80}
            priority
            className="mx-auto h-auto w-[155px] sm:w-[175px]"
          />

          <p className="mx-auto mt-7 max-w-[290px] text-[15px] leading-6 text-slate-500">
            Everything you need to run a pickleball tournament.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-[11px] bg-slate-100 p-1 text-sm font-semibold">
          <Link
            href="/login"
            className={[
              "flex min-h-9 items-center justify-center rounded-[9px] px-3 transition",
              mode === "login"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-slate-500",
            ].join(" ")}
          >
            Login
          </Link>

          <Link
            href="/login?mode=signup"
            className={[
              "flex min-h-9 items-center justify-center rounded-[9px] px-3 transition",
              mode === "signup"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-slate-500",
            ].join(" ")}
          >
            Sign up
          </Link>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-[11px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {infoMessage ? (
          <div className="mt-5 rounded-[11px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-700">
            {infoMessage}
          </div>
        ) : null}

        {mode === "login" ? (
          <form action={loginAction} className="mt-5 flex flex-col gap-3.5">
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              required
              className={inputClass}
            />

            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              required
              className={inputClass}
            />

            <button
              type="submit"
              className="mt-1 min-h-[46px] rounded-[11px] bg-[var(--arena-yellow)] px-4 text-sm font-bold text-neutral-950 transition hover:brightness-95"
            >
              Login
            </button>
          </form>
        ) : (
          <form action={signupAction} className="mt-5 flex flex-col gap-3.5">
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              required
              className={inputClass}
            />

            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              required
              className={inputClass}
            />

            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              required
              className={inputClass}
            />

            <button
              type="submit"
              className="mt-1 min-h-[46px] rounded-[11px] bg-[var(--arena-yellow)] px-4 text-sm font-bold text-neutral-950 transition hover:brightness-95"
            >
              Create account
            </button>
          </form>
        )}

        <div className="mt-5 border-t border-slate-200 pt-5 text-center">
          <Link
            href="/guest"
            className="inline-flex min-h-10 items-center justify-center px-3 text-sm font-bold text-neutral-950 transition hover:opacity-60"
          >
            Continue without an account
          </Link>
        </div>
      </section>
    </main>
  )
}
