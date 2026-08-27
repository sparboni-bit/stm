"use server"
import { revalidatePath } from "next/cache"
import { renameRosterEntry } from "../repositories/roster.repository"

export async function renameRosterEntryAction(rosterId: string, entryId: string, displayName: string) {
  const name = displayName.trim()
  if (!name) throw new Error("Player name is required")
  await renameRosterEntry(entryId, name)
  revalidatePath(`/rosters/${rosterId}`)
}
