"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { GuestAppHeader } from "@/modules/guest-storage/components"
import {
  createGuestCompetition,
} from "@/modules/guest-storage"
import {
  listGuestCompetitionWorkspaces,
} from "@/modules/guest-storage/services"

const GUEST_WORKSPACE_TITLE = "Guest Tournament"

export default function GuestHomePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function enterGuestWorkspace() {
      try {
        const documents = await listGuestCompetitionWorkspaces()

        // Guest Direct Flow: one invisible local Tournament container.
        // If older tests left more than one document, reopen the most recently
        // updated one instead of exposing a Tournament picker to the user.
        const existing = [...documents].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime(),
        )[0]

        if (existing) {
          if (!cancelled) {
            router.replace(
              `/guest/competitions/${existing.competition.id}`,
            )
          }
          return
        }

        const competition = await createGuestCompetition({
          title: GUEST_WORKSPACE_TITLE,
          description: null,
        })

        if (!cancelled) {
          router.replace(
            `/guest/competitions/${competition.id}`,
          )
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to start Guest Mode.",
          )
        }
      }
    }

    void enterGuestWorkspace()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <GuestAppHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {error ? (
          <div className="border border-red-200 bg-red-50 p-5">
            <h1 className="font-bold text-red-800">
              Guest Mode unavailable
            </h1>
            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 min-h-11 bg-neutral-950 px-4 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="border border-neutral-200 bg-white p-6 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              Guest Mode
            </p>
            <h1 className="mt-2 text-xl font-bold text-neutral-950">
              Tournament Management
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Opening your local workspace...
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
