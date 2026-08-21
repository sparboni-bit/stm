import type { BracketViewRound } from "../../view"
import { BRACKET_COLUMN_WIDTH, getBracketMatchTop } from "./bracketLayout"
import { BracketMatchCard } from "./BracketMatchCard"

type BracketColumnProps = {
  round: BracketViewRound
  roundIndex: number
  bodyHeight: number
  competitionId: string
  stageId: string
}

export function BracketColumn({
  round,
  roundIndex,
  bodyHeight,
  competitionId,
  stageId,
}: BracketColumnProps) {
  return (
    <section
      className="relative shrink-0"
      style={{ width: BRACKET_COLUMN_WIDTH, height: bodyHeight }}
    >
      <header className="absolute left-0 right-0 top-0 h-[58px]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Round {round.number}
        </p>
        <h3 className="mt-1 border-b-2 border-slate-950 pb-2 text-sm font-bold uppercase tracking-wide text-slate-950">
          {round.name}
        </h3>
      </header>

      {round.matches.map((match, matchIndex) => (
        <div
          key={match.id}
          className="absolute left-0"
          style={{ top: getBracketMatchTop(roundIndex, matchIndex) }}
        >
          <BracketMatchCard
            match={match}
            competitionId={competitionId}
            stageId={stageId}
          />
        </div>
      ))}
    </section>
  )
}
