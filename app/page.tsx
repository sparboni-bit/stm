import { redirect } from "next/navigation"

import { getCurrentWorkspace } from "@/lib/workspace/getCurrentWorkspace"

export default async function HomePage() {
  const currentWorkspace = await getCurrentWorkspace()

  if (!currentWorkspace) {
    redirect("/login")
  }

  redirect("/competitions")
}
