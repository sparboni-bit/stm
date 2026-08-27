"use server"
import { redirect } from "next/navigation"
import { deleteRoster } from "../repositories/roster.repository"

export async function deleteRosterAction(rosterId: string) {
  await deleteRoster(rosterId)
  redirect("/rosters")
}
