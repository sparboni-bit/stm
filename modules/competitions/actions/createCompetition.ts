"use server"

import { redirect } from "next/navigation"

import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

import {
  createCompetition,
} from "../repositories/competition.repository"

function getDefaultSettings() {
  return {
    scoring: {
      default_mode: "single_set",
    },
    courts: [],
  }
}

export async function createCompetitionAction(
  formData: FormData,
) {
  const title = String(
    formData.get("title") || "",
  ).trim()

  const rawDescription = String(
    formData.get("description") || "",
  ).trim()

  const description =
    rawDescription.length > 0
      ? rawDescription
      : null

  const startDate = String(
    formData.get("start_date") || "",
  ).trim()

  const endDate = String(
    formData.get("end_date") || "",
  ).trim()

  if (!title || !startDate) {
    redirect(
      "/competitions/new?error=missing_fields",
    )
  }

  if (endDate && endDate < startDate) {
    redirect(
      "/competitions/new?error=invalid_dates",
    )
  }

  const currentWorkspace =
    await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect(
      "/login?error=no_active_workspace",
    )
  }

  const {
    member,
    workspace,
  } = currentWorkspace

  const { data, error } =
    await createCompetition({
      organization_id: workspace.id,
      owner_member_id: member.id,
      created_by: member.id,
      title,
      description,
      start_at: `${startDate}T12:00:00.000Z`,
      end_at: endDate
        ? `${endDate}T12:00:00.000Z`
        : null,
      settings: getDefaultSettings(),
      structure: {},
    })

  if (error || !data) {
    redirect(
      "/competitions/new?error=create_failed",
    )
  }

  redirect(
    `/competitions/${data.id}`,
  )
}
