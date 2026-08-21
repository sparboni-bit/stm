"use client"

import { useParams } from "next/navigation"

import {
  GuestTournamentWorkspace,
} from "@/modules/guest-storage/components"

export default function GuestTournamentPage() {
  const params = useParams<{ id: string }>()
  const competitionId = params.id

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
  
      <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <GuestTournamentWorkspace
          competitionId={competitionId}
        />
      </main>
    </div>
  )
}
