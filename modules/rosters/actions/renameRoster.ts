"use server"
import { revalidatePath } from "next/cache"
import { renameRoster } from "../repositories/roster.repository"

export async function renameRosterAction(rosterId: string, name: string) {
  const normalizedName = name.trim()
  if (!normalizedName) throw new Error("Roster name is required")
  await renameRoster(rosterId, normalizedName)
  revalidatePath("/rosters")
  revalidatePath(`/rosters/${rosterId}`)
}
