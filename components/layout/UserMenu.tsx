type UserMenuProps = {
  displayName: string | null
  email: string | null
}

function getInitials(
  displayName: string | null,
  email: string | null
) {
  const source =
    displayName?.trim() ||
    email?.trim() ||
    "STM"

  const words = source
    .split(/\s+/)
    .filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`
      .toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export function UserMenu({
  displayName,
  email,
}: UserMenuProps) {
  const initials = getInitials(
    displayName,
    email
  )

  return (
    <details className="relative shrink-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {initials}
        </span>

        <span className="hidden max-w-40 text-left lg:block">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {displayName || "STM User"}
          </span>

          <span className="block truncate text-xs text-slate-500">
            {email || ""}
          </span>
        </span>
      </summary>

      <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="border-b border-slate-100 px-3 py-2 lg:hidden">
          <p className="truncate text-sm font-semibold text-slate-900">
            {displayName || "STM User"}
          </p>

          <p className="truncate text-xs text-slate-500">
            {email || ""}
          </p>
        </div>

        <a
          href="/logout"
          className="mt-1 block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Logout
        </a>
      </div>
    </details>
  )
}