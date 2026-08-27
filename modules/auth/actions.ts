"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    redirect("/login?error=missing_credentials")
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect("/login?error=login_failed")
  }

  redirect("/")
}

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const confirmPassword = String(formData.get("confirmPassword") || "")

  if (!email || !password || !confirmPassword) {
    redirect("/login?mode=signup&error=missing_fields")
  }

  if (password !== confirmPassword) {
    redirect("/login?mode=signup&error=passwords_do_not_match")
  }

  if (password.length < 8) {
    redirect("/login?mode=signup&error=password_too_short")
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ""}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`)
  }

  redirect("/login?message=check_email")
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
