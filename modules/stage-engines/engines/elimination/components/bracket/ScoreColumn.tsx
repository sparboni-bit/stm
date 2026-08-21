import type { BracketViewScore } from "../../view"

type ScoreColumnProps = {
  score: BracketViewScore
  winnerSide: "A" | "B" | null
}

function ScoreCell({ values, winner, loser }: { values: string[]; winner: boolean; loser: boolean }) {
  if (values.length === 0) return <div className="flex h-8 min-w-9 items-center justify-center" />
  return (
    <div className="flex h-8 items-center justify-end gap-1 px-2">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={[
            "inline-flex h-6 min-w-6 items-center justify-center px-1 font-mono text-[12px] font-bold tabular-nums",
            winner
              ? "bg-slate-950 text-white"
              : loser
                ? "bg-slate-100 text-slate-400"
                : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          {value}
        </span>
      ))}
    </div>
  )
}

function valuesForSide(score: BracketViewScore, side: "A" | "B"): string[] {
  if (score.sets.length > 0) {
    return score.sets.map((set) => {
      const value = side === "A" ? set.a : set.b
      return value === null ? "–" : String(value)
    })
  }
  const value = side === "A" ? score.valueA : score.valueB
  return value === null ? [] : [value]
}

export function ScoreColumn({ score, winnerSide }: ScoreColumnProps) {
  const valuesA = valuesForSide(score, "A")
  const valuesB = valuesForSide(score, "B")
  if (valuesA.length === 0 && valuesB.length === 0) return null

  return (
    <div className="shrink-0 border-l border-slate-200 bg-white">
      <ScoreCell values={valuesA} winner={winnerSide === "A"} loser={winnerSide === "B"} />
      <div className="border-t border-slate-100" />
      <ScoreCell values={valuesB} winner={winnerSide === "B"} loser={winnerSide === "A"} />
    </div>
  )
}
