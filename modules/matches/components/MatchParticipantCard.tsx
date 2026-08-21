import type { MatchParticipantView } from "../view"

type MatchParticipantCardProps = {
  side: "A" | "B"
  participant: MatchParticipantView
  winner: boolean
}

export function MatchParticipantCard({
  side,
  participant,
  winner,
}: MatchParticipantCardProps) {
  const placeholder =
    participant.slotType !== "entry" &&
    participant.slotType !== "rotation_team" &&
    participant.slotType !== "bye"

  return (
    <article
      className={[
        "border border-slate-200 bg-white p-5",
        winner ? "ring-2 ring-inset ring-slate-950" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Side {side}
          </p>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            {participant.seed !== null ? (
              <span className="shrink-0 font-mono text-xs font-bold text-slate-500">
                ({participant.seed})
              </span>
            ) : null}

            <p
              className={[
                "min-w-0 truncate text-lg",
                winner
                  ? "font-bold text-slate-950"
                  : placeholder
                    ? "font-medium italic text-slate-400"
                    : "font-semibold text-slate-800",
              ].join(" ")}
              title={participant.displayName}
            >
              {participant.displayName}
            </p>
          </div>
        </div>

        {winner ? (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Winner
          </span>
        ) : null}
      </div>
    </article>
  )
}
