import type { MatchDetailView } from "../view"
import { MatchParticipantCard } from "./MatchParticipantCard"

type MatchPlayersProps = {
  match: MatchDetailView
}

export function MatchPlayers({
  match,
}: MatchPlayersProps) {
  return (
    <section className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
      <MatchParticipantCard
        side="A"
        participant={match.sideA}
        winner={match.winnerSide === "A"}
      />

      <div className="flex items-center justify-center px-2 py-0 md:py-1">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          VS
        </span>
      </div>

      <MatchParticipantCard
        side="B"
        participant={match.sideB}
        winner={match.winnerSide === "B"}
      />
    </section>
  )
}
