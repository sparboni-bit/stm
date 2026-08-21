import type { FairnessPlayer } from "./types"

export type FairnessFloor = {
  participationSpread: number
  sitoutSpread: number
  consecutiveSitouts: number
  participationPenalty: number
  sitoutPenalty: number
  consecutiveSitoutPenalty: number
  total: number
}

export function calculateFairnessFloor(
  players: readonly FairnessPlayer[],
  courtCount: number,
  roundCount: number,
  participationWeight: number,
  sitoutWeight: number,
  consecutiveSitoutWeight = 2_500,
): FairnessFloor {
  const n = players.length
  if (n === 0 || roundCount <= 0) return {
    participationSpread:0, sitoutSpread:0, consecutiveSitouts:0,
    participationPenalty:0, sitoutPenalty:0, consecutiveSitoutPenalty:0, total:0,
  }

  const usableCourts=Math.min(Math.max(0,courtCount),Math.floor(n/4))
  const activePerRound=usableCourts*4
  const restsPerRound=n-activePerRound
  const totalAppearances=activePerRound*roundCount
  const totalRests=restsPerRound*roundCount

  const participationSpread=totalAppearances%n===0?0:1
  const sitoutSpread=totalRests%n===0?0:1

  // Two resting sets of size S drawn from N players must overlap
  // by at least max(0, 2S-N). Each forced overlap is exactly one
  // unavoidable consecutive-sitout event in FairnessState.
  const forcedOverlapPerTransition=Math.max(0,2*restsPerRound-n)
  const consecutiveSitouts=Math.max(0,roundCount-1)*forcedOverlapPerTransition

  const participationPenalty=participationSpread*participationWeight
  const sitoutPenalty=sitoutSpread*sitoutWeight
  const consecutiveSitoutPenalty=consecutiveSitouts*consecutiveSitoutWeight

  return {
    participationSpread,sitoutSpread,consecutiveSitouts,
    participationPenalty,sitoutPenalty,consecutiveSitoutPenalty,
    total:participationPenalty+sitoutPenalty+consecutiveSitoutPenalty,
  }
}

export function normalizedFairnessScore(rawPenalty:number,theoreticalFloor:number):number {
  const avoidablePenalty=Math.max(0,rawPenalty-theoreticalFloor)
  if(avoidablePenalty===0)return 100
  return Math.max(0,Math.round(100/(1+avoidablePenalty/10_000)))
}
