"use server"

import { revalidatePath } from "next/cache"

import { addRosterEntriesBulk } from "../repositories/roster.repository"

export async function addRosterEntriesBulkAction(
  rosterId: string,
  displayNames: string[],
) {
  if (!rosterId) {
    throw new Error("Roster is required.")
  }

  const normalizedNames = displayNames
    .map((name) => name.trim())
    .filter(Boolean)

  if (normalizedNames.length === 0) {
    throw new Error("Add at least one valid participant.")
  }

  if (normalizedNames.length > 256) {
    throw new Error("A maximum of 256 participants can be imported at once.")
  }

  const imported = await addRosterEntriesBulk(
    rosterId,
    normalizedNames,
  )

  revalidatePath("/rosters")
  revalidatePath(`/rosters/${rosterId}`)

  return { imported }
}
