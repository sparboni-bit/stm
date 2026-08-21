import type { BracketViewModel } from "../../view"
import { BRACKET_COLUMN_WIDTH, getBracketColumnX, getBracketMatchCenterY } from "./bracketLayout"
import { BracketConnector } from "./BracketConnector"

type BracketConnectorLayerProps = {
  view: BracketViewModel
  width: number
  height: number
}

export function BracketConnectorLayer({ view, width, height }: BracketConnectorLayerProps) {
  if (view.rounds.length < 2) return null

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {view.rounds.slice(0, -1).flatMap((round, roundIndex) => {
        const nextRound = view.rounds[roundIndex + 1]
        if (!nextRound) return []

        const sourceRight = getBracketColumnX(roundIndex) + BRACKET_COLUMN_WIDTH
        const targetLeft = getBracketColumnX(roundIndex + 1)

        return nextRound.matches.map((_, targetMatchIndex) => {
          const firstSourceIndex = targetMatchIndex * 2
          const secondSourceIndex = firstSourceIndex + 1

          if (!round.matches[firstSourceIndex] || !round.matches[secondSourceIndex]) return null

          return (
            <BracketConnector
              key={`${roundIndex}-${targetMatchIndex}`}
              sourceX={sourceRight}
              sourceY={getBracketMatchCenterY(roundIndex, firstSourceIndex)}
              siblingY={getBracketMatchCenterY(roundIndex, secondSourceIndex)}
              targetX={targetLeft}
              targetY={getBracketMatchCenterY(roundIndex + 1, targetMatchIndex)}
            />
          )
        })
      })}
    </svg>
  )
}
