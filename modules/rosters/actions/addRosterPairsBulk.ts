"use server"

import { revalidatePath } from "next/cache"

import type { BulkRosterPairInput } from "../types"
import { addRosterPairsBulk } from "../repositories/roster.repository"

export async function addRosterPairsBulkAction(
  rosterId: string,
  pairs: BulkRosterPairInput[],
) {
  if (!rosterId) {
    throw new Error("Roster is required.")
  }

  if (!Array.isArray(pairs) || pairs.length === 0) {
    throw new Error("Add at least one valid pair.")
  }

  if (pairs.length > 128) {
    throw new Error("A maximum of 128 pairs can be imported at once.")
  }

  const normalized = pairs.map((pair, index) => {
    const playerAName = pair.playerAName.trim()
    const playerBName = pair.playerBName.trim()

    if (!playerAName || !playerBName) {
      throw new Error(
        `Row ${index + 1}: both player names are required.`,
      )
    }

    return {
      playerAName,
      playerBName,
    }
  })

  const result = await addRosterPairsBulk(rosterId, normalized)

  revalidatePath("/rosters")
  revalidatePath(`/rosters/${rosterId}`)

  return result
}
