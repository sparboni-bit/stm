import { createClient } from "@/lib/supabase/server"
import type { MatchSide, MatchSlot } from "../types"
import { autoCompleteStageIfReady } from "../../competition-stages/actions/stageCompletion"

export type SaveSingleSetResultInput = {
  matchId: string
  scoreA: number
  scoreB: number
}

export type BestOf3SetInput = {
  scoreA: number
  scoreB: number
}

export type SaveBestOf3ResultInput = {
  matchId: string
  sets: BestOf3SetInput[]
}

export type SaveRetirementResultInput = {
  matchId: string
  retiredSide: MatchSide
  scoreFormat: "single_set" | "best_of_3"
  sets: BestOf3SetInput[]
}

type LinkedMatch = {
  id: string
  status: string
  side_a: MatchSlot
  side_b: MatchSlot
}

type LoadedMatch = {
  id: string
  stage_id: string
  is_bye: boolean
  match_type: string | null
  side_a: MatchSlot
  side_b: MatchSlot
  next_match_id: string | null
  next_match_slot: MatchSide | null
}

function validateScore(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`)
  }
}

function entryId(slot: MatchSlot): string | null {
  return slot.type === "entry" && slot.entryId
    ? slot.entryId
    : null
}

function isResolvedSlot(slot: MatchSlot): boolean {
  if (slot.type === "entry") {
    return Boolean(slot.entryId)
  }

  if (slot.type === "rotation_team") {
    return (
      Array.isArray(slot.entryIds) &&
      slot.entryIds.length === 2 &&
      slot.entryIds.every(
        (id) =>
          typeof id === "string" &&
          id.trim().length > 0,
      )
    )
  }

  return false
}

function nextStatus(
  a: MatchSlot,
  b: MatchSlot,
): "pending" | "ready" {
  return isResolvedSlot(a) &&
    isResolvedSlot(b)
    ? "ready"
    : "pending"
}

async function loadMatch(
  matchId: string,
): Promise<LoadedMatch> {
  const id = matchId.trim()

  if (!id) {
    throw new Error("Match id is required.")
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id,stage_id,is_bye,match_type,side_a,side_b,next_match_id,next_match_slot",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Match not found.")
  }

  if (data.is_bye) {
    throw new Error("A BYE match cannot receive a result.")
  }

  return {
    id: data.id,
    stage_id: data.stage_id,
    is_bye: data.is_bye,
    match_type: data.match_type,
    side_a: data.side_a as MatchSlot,
    side_b: data.side_b as MatchSlot,
    next_match_id: data.next_match_id,
    next_match_slot:
      data.next_match_slot as MatchSide | null,
  }
}

function resolvedParticipants(
  match: LoadedMatch,
) {
  if (
    !isResolvedSlot(match.side_a) ||
    !isResolvedSlot(match.side_b)
  ) {
    throw new Error(
      "Both participants must be resolved before saving a result.",
    )
  }

  return {
    aId: entryId(match.side_a),
    bId: entryId(match.side_b),
  }
}

async function loadAndValidateDownstream(
  match: LoadedMatch,
): Promise<LinkedMatch | null> {
  if (!match.next_match_id) {
    return null
  }

  if (!match.next_match_slot) {
    throw new Error(
      "Invalid bracket link: next match slot is missing.",
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("matches")
    .select("id,status,side_a,side_b")
    .eq("id", match.next_match_id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Linked next match not found.")
  }

  const linked = data as LinkedMatch

  if (
    linked.status === "on_court" ||
    linked.status === "completed"
  ) {
    throw new Error(
      "Result locked: the next match has already started or been completed.",
    )
  }

  return linked
}

async function propagateWinner(
  match: LoadedMatch,
  linked: LinkedMatch | null,
  winnerEntryId: string,
) {
  if (
    !linked ||
    !match.next_match_id ||
    !match.next_match_slot
  ) {
    return
  }

  const propagated: MatchSlot = {
    type: "entry",
    entryId: winnerEntryId,
    sourceMatchId: match.id,
  }

  const newA =
    match.next_match_slot === "A"
      ? propagated
      : linked.side_a

  const newB =
    match.next_match_slot === "B"
      ? propagated
      : linked.side_b

  const supabase = await createClient()

  const { error } = await supabase
    .from("matches")
    .update({
      side_a: newA,
      side_b: newB,
      status: nextStatus(newA, newB),
    })
    .eq("id", match.next_match_id)

  if (error) {
    throw new Error(
      `Result saved, but winner propagation failed: ${error.message}`,
    )
  }
}

export async function saveSingleSetMatchResult({
  matchId,
  scoreA,
  scoreB,
}: SaveSingleSetResultInput): Promise<void> {
  validateScore(scoreA, "Score A")
  validateScore(scoreB, "Score B")

  const match = await loadMatch(matchId)

  const isIndividualRotation =
    match.match_type === "individual_rotation"

  if (scoreA === scoreB && !isIndividualRotation) {
    throw new Error(
      "A completed match cannot end in a draw.",
    )
  }
  const { aId, bId } = resolvedParticipants(match)
  const linked =
    await loadAndValidateDownstream(match)

  const winnerSide: MatchSide | null =
    scoreA === scoreB
      ? null
      : scoreA > scoreB
        ? "A"
        : "B"

  const loserSide: MatchSide | null =
    winnerSide === null
      ? null
      : winnerSide === "A"
        ? "B"
        : "A"

  const winnerEntryId =
    winnerSide === "A"
      ? aId
      : winnerSide === "B"
        ? bId
        : null

  const supabase = await createClient()

  const { error } = await supabase
    .from("matches")
    .update({
      score: {
        format: "single_set",
        scoreA,
        scoreB,
      },
      winner_side: winnerSide,
      loser_side: loserSide,
      status: "completed",
      finish_type: "normal",
      retired_side: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", match.id)

  if (error) {
    throw new Error(error.message)
  }

  if (match.next_match_id) {
    if (!winnerEntryId) {
      throw new Error(
        "Only a resolved single entry can be propagated to a linked match.",
      )
    }

    await propagateWinner(
      match,
      linked,
      winnerEntryId,
    )
  }

  if (
    !match.next_match_id &&
    match.side_a.type !== "rotation_team" &&
    match.side_b.type !== "rotation_team"
  ) {
    await autoCompleteStageIfReady(match.stage_id)
  }
}

export async function saveBestOf3MatchResult({
  matchId,
  sets,
}: SaveBestOf3ResultInput): Promise<void> {
  if (sets.length < 2 || sets.length > 3) {
    throw new Error(
      "Best of 3 requires two or three completed sets.",
    )
  }

  let setsA = 0
  let setsB = 0

  const normalizedSets: Array<{
    a: number
    b: number
  }> = []

  sets.forEach((set, index) => {
    validateScore(
      set.scoreA,
      `Set ${index + 1} score A`,
    )

    validateScore(
      set.scoreB,
      `Set ${index + 1} score B`,
    )

    if (set.scoreA === set.scoreB) {
      throw new Error(
        `Set ${index + 1} cannot end in a draw.`,
      )
    }

    if (setsA === 2 || setsB === 2) {
      throw new Error(
        "A set was entered after the match was already decided.",
      )
    }

    if (set.scoreA > set.scoreB) {
      setsA += 1
    } else {
      setsB += 1
    }

    normalizedSets.push({
      a: set.scoreA,
      b: set.scoreB,
    })
  })

  if (setsA !== 2 && setsB !== 2) {
    throw new Error(
      "Best of 3 is incomplete: one side must win two sets.",
    )
  }

  const match = await loadMatch(matchId)

  const { aId, bId } = resolvedParticipants(match)
  const linked =
    await loadAndValidateDownstream(match)

  const winnerSide: MatchSide =
    setsA === 2 ? "A" : "B"

  const loserSide: MatchSide =
    winnerSide === "A" ? "B" : "A"

  const winnerEntryId =
    winnerSide === "A" ? aId : bId

  const supabase = await createClient()

  const { error } = await supabase
    .from("matches")
    .update({
      score: {
        format: "best_of_3",
        sets: normalizedSets,
        setsA,
        setsB,
      },
      winner_side: winnerSide,
      loser_side: loserSide,
      status: "completed",
      finish_type: "normal",
      retired_side: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", match.id)

  if (error) {
    throw new Error(error.message)
  }

  if (match.next_match_id) {
    if (!winnerEntryId) {
      throw new Error(
        "Only a resolved single entry can be propagated to a linked match.",
      )
    }

    await propagateWinner(
      match,
      linked,
      winnerEntryId,
    )
  }

  if (
    !match.next_match_id &&
    match.side_a.type !== "rotation_team" &&
    match.side_b.type !== "rotation_team"
  ) {
    await autoCompleteStageIfReady(match.stage_id)
  }
}

export async function saveRetirementMatchResult({
  matchId,
  retiredSide,
  scoreFormat,
  sets,
}: SaveRetirementResultInput): Promise<void> {
  if (
    retiredSide !== "A" &&
    retiredSide !== "B"
  ) {
    throw new Error(
      "Retired side must be A or B.",
    )
  }

  if (scoreFormat !== "single_set" && scoreFormat !== "best_of_3") {
    throw new Error("Invalid retirement score format.")
  }

  if (scoreFormat === "single_set" && sets.length > 1) {
    throw new Error("Single set retirement accepts at most one partial set.")
  }

  if (scoreFormat === "best_of_3" && sets.length > 3) {
    throw new Error("Best of 3 retirement accepts at most three sets.")
  }

  const normalizedSets = sets.map((set, index) => {
    validateScore(set.scoreA, `Set ${index + 1} score A`)
    validateScore(set.scoreB, `Set ${index + 1} score B`)
    return { a: set.scoreA, b: set.scoreB }
  })

  const match = await loadMatch(matchId)

  const { aId, bId } = resolvedParticipants(match)
  const linked =
    await loadAndValidateDownstream(match)

  const winnerSide: MatchSide =
    retiredSide === "A" ? "B" : "A"

  const loserSide: MatchSide =
    retiredSide

  const winnerEntryId =
    winnerSide === "A" ? aId : bId

  const supabase = await createClient()

  const { error } = await supabase
    .from("matches")
    .update({
      score: {
        format: scoreFormat,
        sets: normalizedSets,
      },
      winner_side: winnerSide,
      loser_side: loserSide,
      status: "completed",
      finish_type: "retirement",
      retired_side: retiredSide,
      completed_at: new Date().toISOString(),
    })
    .eq("id", match.id)

  if (error) {
    throw new Error(error.message)
  }

  if (match.next_match_id) {
    if (!winnerEntryId) {
      throw new Error(
        "Only a resolved single entry can be propagated to a linked match.",
      )
    }

    await propagateWinner(
      match,
      linked,
      winnerEntryId,
    )
  }

  if (
    !match.next_match_id &&
    match.side_a.type !== "rotation_team" &&
    match.side_b.type !== "rotation_team"
  ) {
    await autoCompleteStageIfReady(match.stage_id)
  }
}
