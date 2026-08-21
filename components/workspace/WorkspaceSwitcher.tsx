"use client"

import { useRouter } from "next/navigation"
import {
  useState,
  useTransition,
} from "react"

import {
  setCurrentWorkspace,
} from "@/lib/workspace/setCurrentWorkspace"

import type {
  WorkspaceMembership,
} from "@/lib/workspace/types"

type WorkspaceSwitcherProps = {
  memberships: WorkspaceMembership[]
  currentWorkspaceId: string
  compact?: boolean
}

function getWorkspaceTypeLabel(
  organizationType: "personal" | "business"
) {
  return organizationType === "personal"
    ? "Personal"
    : "Business"
}

export function WorkspaceSwitcher({
  memberships,
  currentWorkspaceId,
  compact = false,
}: WorkspaceSwitcherProps) {
  const router = useRouter()

  const [
    selectedWorkspaceId,
    setSelectedWorkspaceId,
  ] = useState(currentWorkspaceId)

  const [error, setError] =
    useState<string | null>(null)

  const [isPending, startTransition] =
    useTransition()

  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const workspaceId =
      event.target.value

    const previousWorkspaceId =
      selectedWorkspaceId

    setSelectedWorkspaceId(
      workspaceId
    )

    setError(null)

    startTransition(async () => {
      const result =
        await setCurrentWorkspace(
          workspaceId
        )

      if (!result.success) {
        setSelectedWorkspaceId(
          previousWorkspaceId
        )

        setError(
          result.error ===
            "workspace_not_available"
            ? "Workspace unavailable."
            : "Unable to change workspace."
        )

        return
      }

      router.refresh()
    })
  }

  return (
    <div className="min-w-0">
      {!compact && (
        <label
          htmlFor="workspace-switcher"
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Workspace
        </label>
      )}

      <div className="relative">
        <select
          id="workspace-switcher"
          aria-label="Current workspace"
          value={selectedWorkspaceId}
          onChange={handleChange}
          disabled={
            isPending ||
            memberships.length <= 1
          }
          className={`w-full min-w-0 appearance-none border border-slate-300 bg-white pr-9 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
            compact
              ? "rounded-lg px-3 py-2"
              : "rounded-xl py-3 pl-3"
          }`}
        >
          {memberships.map(
            ({ workspace }) => (
              <option
                key={workspace.id}
                value={workspace.id}
              >
                {workspace.name} ·{" "}
                {getWorkspaceTypeLabel(
                  workspace.organization_type
                )}
              </option>
            )
          )}
        </select>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
        >
          {isPending ? "…" : "⌄"}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-1 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}