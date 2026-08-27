"use server"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  getRoster,
} from "../repositories/roster.repository"

import type {
  RosterWithEntries,
} from "../types"

export async function getRosterForStageAction(
  rosterId: string,
): Promise<RosterWithEntries> {
  const normalizedId = rosterId.trim()

  if (!normalizedId) {
    throw new Error("Roster is required.")
  }

  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    throw new Error("No active workspace.")
  }

  const roster =
    await getRoster(normalizedId)

  if (
    roster.organization_id !==
    currentWorkspace.workspace.id
  ) {
    throw new Error(
      "Roster does not belong to the current organization.",
    )
  }

  return roster
}
