import type { BracketViewModel } from "../../view"
import {
  BRACKET_CANVAS_PADDING,
  BRACKET_COLUMN_GAP,
  BRACKET_COLUMN_WIDTH,
  BRACKET_FIRST_ROUND_STEP,
  BRACKET_MATCH_BLOCK_HEIGHT,
  BRACKET_ROUND_HEADER_HEIGHT,
} from "./bracketLayout"
import { BracketColumn } from "./BracketColumn"
import { BracketConnectorLayer } from "./BracketConnectorLayer"

type DesktopBracketViewerProps = { view: BracketViewModel }

function getCanvasWidth(roundCount: number): number {
  return BRACKET_CANVAS_PADDING * 2 +
    roundCount * BRACKET_COLUMN_WIDTH +
    Math.max(0, roundCount - 1) * BRACKET_COLUMN_GAP
}

function getCanvasHeight(firstRoundMatchCount: number): number {
  if (firstRoundMatchCount <= 0) return 240
  return BRACKET_CANVAS_PADDING * 2 +
    BRACKET_ROUND_HEADER_HEIGHT +
    BRACKET_MATCH_BLOCK_HEIGHT +
    Math.max(0, firstRoundMatchCount - 1) * BRACKET_FIRST_ROUND_STEP
}

export function DesktopBracketViewer({ view }: DesktopBracketViewerProps) {
  const firstRoundMatches = view.rounds[0]?.matches.length ?? 0
  const canvasWidth = getCanvasWidth(view.rounds.length)
  const canvasHeight = getCanvasHeight(firstRoundMatches)
  const bodyHeight = canvasHeight - BRACKET_CANVAS_PADDING * 2

  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
          <BracketConnectorLayer view={view} width={canvasWidth} height={canvasHeight} />

          <div
            className="absolute flex items-start"
            style={{
              left: BRACKET_CANVAS_PADDING,
              top: BRACKET_CANVAS_PADDING,
              gap: BRACKET_COLUMN_GAP,
            }}
          >
            {view.rounds.map((round, index) => (
              <BracketColumn
                key={round.number}
                round={round}
                roundIndex={index}
                bodyHeight={bodyHeight}
                competitionId={view.competitionId}
                stageId={view.stageId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
