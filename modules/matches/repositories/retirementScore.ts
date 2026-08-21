import type { MatchSide } from "../types"

export type RetirementPartialSet = {
  a: number
  b: number
}

export type RetirementScoreFormat =
  | "single_set"
  | "best_of_3"

export type RetirementScorePayload = {
  format: RetirementScoreFormat
  sets: RetirementPartialSet[]
}

export function buildRetirementScorePayload(
  format: RetirementScoreFormat,
  sets: RetirementPartialSet[],
): RetirementScorePayload {
  return {
    format,
    sets,
  }
}

export function retirementWinnerSide(
  retiredSide: MatchSide,
): MatchSide {
  return retiredSide === "A" ? "B" : "A"
}
