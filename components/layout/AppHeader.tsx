import Image from "next/image"
import Link from "next/link"

import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher"

import { UserMenu } from "./UserMenu"

import type {
  CurrentWorkspace,
  WorkspaceMembership,
} from "@/lib/workspace/types"

type AppHeaderProps = {
  currentWorkspace: CurrentWorkspace
  memberships: WorkspaceMembership[]
}

export function AppHeader({
  currentWorkspace,
  memberships,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-3 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Pickleball Arena App home"
        >
          <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden bg-[var(--arena-yellow)] px-1.5">
            <Image
              src="/brand/pickleball-arena-logo.png"
              alt="Pickleball Arena"
              width={180}
              height={64}
              priority
              className="h-auto w-full"
            />
          </span>

          <span className="hidden min-w-0 lg:block">
            <span className="block text-sm font-bold leading-tight tracking-tight text-slate-950">
              Pickleball Arena App
            </span>
            <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">
              Tournament management
            </span>
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="ml-auto max-w-md">
            <WorkspaceSwitcher
              memberships={memberships}
              currentWorkspaceId={
                currentWorkspace.workspace.id
              }
              compact
            />
          </div>
        </div>

        <UserMenu
          displayName={
            currentWorkspace.member.display_name
          }
          email={
            currentWorkspace.member.email
          }
        />
      </div>
    </header>
  )
}
