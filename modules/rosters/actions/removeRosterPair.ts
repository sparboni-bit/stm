"use server"

import { revalidatePath } from "next/cache"

import { removeRosterPair } from "../repositories/roster.repository"

export async function removeRosterPairAction(
  rosterId: string,
  pairId: string,
) {
  await removeRosterPair(pairId)
  revalidatePath(`/rosters/${rosterId}`)
}
