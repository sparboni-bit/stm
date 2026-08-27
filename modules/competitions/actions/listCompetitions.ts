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

  const now = Date.now()

  return {
    active: competitions.filter(
      (competition) => {
        if (!competition.end_at) {
          return true
        }

        const endAt = new Date(
          competition.end_at,
        ).getTime()

        return (
          Number.isNaN(endAt) ||
          endAt >= now
        )
      },
    ),

    archived: competitions.filter(
      (competition) => {
        if (!competition.end_at) {
          return false
        }

        const endAt = new Date(
          competition.end_at,
        ).getTime()

        return (
          !Number.isNaN(endAt) &&
          endAt < now
        )
      },
    ),
  }
}