"use server"
import { revalidatePath } from "next/cache"
import { removeRosterEntry } from "../repositories/roster.repository"

export async function removeRosterEntryAction(rosterId: string, entryId: string) {
  await removeRosterEntry(entryId)
  revalidatePath(`/rosters/${rosterId}`)
}
