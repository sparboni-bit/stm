export type WorkspaceType =
  | "personal"
  | "business"

export type WorkspaceStatus =
  | "active"
  | "disabled"

export type WorkspaceMemberRole =
  | "owner"
  | "manager"
  | "coach"
  | "viewer"

export type WorkspaceMemberStatus =
  | "pending"
  | "active"
  | "disabled"

export type Workspace = {
  id: string
  name: string
  slug: string
  status: WorkspaceStatus
  organization_type: WorkspaceType
  personal_owner_user_id: string | null
  settings: Record<string, unknown>
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WorkspaceMember = {
  id: string
  user_id: string
  organization_id: string
  role: WorkspaceMemberRole
  status: WorkspaceMemberStatus
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type WorkspaceMembership = {
  member: WorkspaceMember
  workspace: Workspace
}

export type CurrentWorkspace = WorkspaceMembership