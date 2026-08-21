export const BRACKET_COLUMN_WIDTH = 272
export const BRACKET_COLUMN_GAP = 48
export const BRACKET_MATCH_BLOCK_HEIGHT = 96
export const BRACKET_FIRST_ROUND_STEP = 120
export const BRACKET_ROUND_HEADER_HEIGHT = 58
export const BRACKET_CANVAS_PADDING = 24

export function getBracketMatchCenterY(roundIndex: number, matchIndex: number): number {
  const multiplier = 2 ** roundIndex
  return BRACKET_ROUND_HEADER_HEIGHT +
    BRACKET_MATCH_BLOCK_HEIGHT / 2 +
    (matchIndex * multiplier + (multiplier - 1) / 2) * BRACKET_FIRST_ROUND_STEP
}

export function getBracketMatchTop(roundIndex: number, matchIndex: number): number {
  return getBracketMatchCenterY(roundIndex, matchIndex) - BRACKET_MATCH_BLOCK_HEIGHT / 2
}

export function getBracketColumnX(roundIndex: number): number {
  return BRACKET_CANVAS_PADDING +
    roundIndex * (BRACKET_COLUMN_WIDTH + BRACKET_COLUMN_GAP)
}
