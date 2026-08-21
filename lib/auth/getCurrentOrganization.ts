import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

export async function getCurrentOrganization() {
  const currentWorkspace =
    await getCurrentWorkspace()

  return (
    currentWorkspace?.workspace ??
    null
  )
}