import type { ReactNode } from "react"

import { AppHeader } from "./AppHeader"
import { PageContainer } from "./PageContainer"

import type {
  CurrentWorkspace,
  WorkspaceMembership,
} from "@/lib/workspace/types"

type AppShellProps = {
  children: ReactNode
  currentWorkspace: CurrentWorkspace
  memberships: WorkspaceMembership[]
}

export function AppShell({
  children,
  currentWorkspace,
  memberships,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--arena-gray-50)] text-slate-900">
      <AppHeader
        currentWorkspace={currentWorkspace}
        memberships={memberships}
      />

      <main className="mx-auto w-full max-w-7xl">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  )
}