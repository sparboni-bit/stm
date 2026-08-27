import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "cloud"

function isGuestPublicPath(pathname: string) {
  return (
    pathname === "/guest" ||
    pathname.startsWith("/guest/")
  )
}

function guestRedirectPath(pathname: string) {
  if (pathname === "/" || pathname === "/login") {
    return "/guest"
  }

  if (pathname === "/competitions/new") {
    return "/guest/new"
  }

  const competitionMatch = pathname.match(
    /^\/competitions\/([^/]+)(?:\/.*)?$/,
  )

  if (competitionMatch) {
    return `/guest/competitions/${competitionMatch[1]}`
  }

  if (pathname === "/competitions") {
    return "/guest"
  }

  return null
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (APP_MODE === "guest") {
    const target = guestRedirectPath(pathname)

    if (target) {
      const url = request.nextUrl.clone()
      url.pathname = target
      url.search = ""
      return NextResponse.redirect(url)
    }

    // Guest pages do not need a Supabase session refresh.
    if (isGuestPublicPath(pathname)) {
      return NextResponse.next({ request })
    }
  }

  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  await supabase.auth.getUser()

  return response
}
