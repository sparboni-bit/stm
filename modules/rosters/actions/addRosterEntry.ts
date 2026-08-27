"use server"
import { revalidatePath } from "next/cache"
import { addRosterEntry } from "../repositories/roster.repository"

export async function addRosterEntryAction(rosterId: string, formData: FormData) {
  const displayName = String(formData.get("displayName") || "").trim()
  if (!displayName) throw new Error("Player name is required")
  await addRosterEntry({ rosterId, displayName })
  revalidatePath(`/rosters/${rosterId}`)
}
