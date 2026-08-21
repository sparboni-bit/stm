"use server"

import {
  createClient,
} from "@/lib/supabase/server"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import type {
  Competition,
  CompetitionListResult,
} from "../types"

function canSeeAllCompetitions(
  role: string
) {
  return (
    role === "owner" ||
    role === "manager" ||
    role === "viewer"
  )
}

export async function listCompetitionsAction(): Promise<CompetitionListResult> {
  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    return {
      active: [],
      archived: [],
    }
  }

  const {
    member,
    workspace,
  } = currentWorkspace

  const supabase =
    await createClient()

  let query = supabase
    .from("competitions")
    .select("*")
    .eq(
      "organization_id",
      workspace.id
    )
    .order("created_at", {
      ascending: false,
    })

  if (
    !canSeeAllCompetitions(
      member.role
    )
  ) {
    query = query.eq(
      "owner_member_id",
      member.id
    )
  }

  const { data, error } =
    await query

  if (error || !data) {
    console.error(
      "Unable to list competitions:",
      error
    )

    return {
      active: [],
      archived: [],
    }
  }

  const competitions =
    data as Competition[]

  return {
    active: competitions.filter(
      (competition) =>
        competition.status !==
        "archived"
    ),

    archived:
      competitions.filter(
        (competition) =>
          competition.status ===
          "archived"
      ),
  }
}