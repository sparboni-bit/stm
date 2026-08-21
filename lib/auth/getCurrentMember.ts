import {
  getCurrentWorkspace,
} from "@/lib/workspace/getCurrentWorkspace"

export async function getCurrentMember() {
  const currentWorkspace =
    await getCurrentWorkspace()

  return (
    currentWorkspace?.member ??
    null
  )
}