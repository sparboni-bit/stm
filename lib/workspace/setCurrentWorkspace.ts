"use server"

import { cookies } from "next/headers"

import {
  CURRENT_WORKSPACE_COOKIE,
  CURRENT_WORKSPACE_COOKIE_MAX_AGE,
} from "./constants"

import {
  getWorkspaceMemberships,
} from "./getWorkspaceMemberships"

export type SetCurrentWorkspaceResult =
  | {
      success: true
    }
  | {
      success: false
      error:
        | "not_authenticated"
        | "workspace_not_available"
    }

export async function setCurrentWorkspace(
  workspaceId: string
): Promise<SetCurrentWorkspaceResult> {
  const normalizedWorkspaceId =
    workspaceId.trim()

  if (!normalizedWorkspaceId) {
    return {
      success: false,
      error: "workspace_not_available",
    }
  }

  const memberships =
    await getWorkspaceMemberships()

  if (memberships.length === 0) {
    return {
      success: false,
      error: "not_authenticated",
    }
  }

  const membership = memberships.find(
    (item) =>
      item.workspace.id ===
      normalizedWorkspaceId
  )

  if (!membership) {
    return {
      success: false,
      error: "workspace_not_available",
    }
  }

  const cookieStore = await cookies()

  cookieStore.set(
    CURRENT_WORKSPACE_COOKIE,
    membership.workspace.id,
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge:
        CURRENT_WORKSPACE_COOKIE_MAX_AGE,
    }
  )

  return {
    success: true,
  }
}