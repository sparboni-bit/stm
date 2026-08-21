import type { BracketViewParticipant } from "../../view"
import { SeedBadge } from "./SeedBadge"

type PlayerRowProps = {
  participant: BracketViewParticipant
  winner: boolean
  loser: boolean
}

export function PlayerRow({ participant, winner, loser }: PlayerRowProps) {
  const placeholder = participant.slotType !== "entry" && participant.slotType !== "bye"
  return (
    <div className="flex h-8 min-w-0 items-center gap-2 px-2.5">
      <SeedBadge seed={participant.seed} />
      <span
        className={[
          "min-w-0 flex-1 truncate text-[13px]",
          winner
            ? "font-bold text-slate-950"
            : loser
              ? "font-medium text-slate-400"
              : placeholder || participant.slotType === "bye"
                ? "font-medium italic text-slate-400"
                : "font-semibold text-slate-700",
        ].join(" ")}
        title={participant.displayName}
      >
        {participant.displayName}
      </span>
    </div>
  )
}
