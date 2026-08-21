import { createClient } from "@/lib/supabase/server"

import type {
  CompetitionEntry,
} from "../../../../competition-entries/types"

import {
  listCompetitionStageEntries,
} from "../../../../competition-stage-entries/repositories/competition-stage-entry.repository"

import {
  getCompetitionStage,
} from "../../../../competition-stages/repositories/competition-stage.repository"

import type {
  MatchRow,
} from "../../../../matches"

import {
  BracketViewBuilder,
  type BracketViewModel,
} from "../view"

const matchSelect = `
  id,
  competition_id,
  stage_id,
  match_number,
  visible_match_number,
  status,
  phase_key,
  group_key,
  round_number,
  match_order,
  match_type,
  court_label,
  side_a,
  side_b,
  score,
  winner_side,
  loser_side,
  is_bye,
  next_match_id,
  next_match_slot,
  finish_type,
  retired_side,
  scheduled_at,
  started_at,
  completed_at,
  metadata,
  created_at,
  updated_at
`

const entrySelect = `
  id,
  competition_id,
  player_id,
  team_id,
  entry_type,
  display_name,
  source,
  status,
  sort_order,
  metadata,
  created_at,
  updated_at
`

export async function loadBracketView(
  stageId: string,
): Promise<BracketViewModel | null> {
  const normalizedStageId =
    stageId.trim()

  if (!normalizedStageId) {
    throw new Error(
      "Stage id is required.",
    )
  }

  const stage =
    await getCompetitionStage(
      normalizedStageId,
    )

  if (!stage) {
    return null
  }

  const supabase =
    await createClient()

  /*
   * Stage Entries determine which Competition
   * Entries belong to this Stage.
   *
   * Competition Entries remain the source of
   * identity/display information.
   */
  const stageEntries =
    await listCompetitionStageEntries(
      stage.id,
    )

  const activeStageEntries =
    stageEntries.filter(
      (entry) =>
        entry.status === "active",
    )

  const seedsByEntryId =
    new Map<string, number | null>(
      activeStageEntries.map(
        (entry) => [
          entry.competition_entry_id,
          entry.seed,
        ],
      ),
    )    

  const stageCompetitionEntryIds =
    activeStageEntries.map(
      (entry) =>
        entry.competition_entry_id,
    )

  const {
    data: matchData,
    error: matchError,
  } = await supabase
    .from("matches")
    .select(matchSelect)
    .eq("stage_id", stage.id)
    .order(
      "round_number",
      { ascending: true },
    )
    .order(
      "match_order",
      { ascending: true },
    )

  if (matchError) {
    throw new Error(
      matchError.message,
    )
  }

  /*
   * A Stage without assigned entries can still
   * legitimately have no Competition Entries.
   * Avoid calling .in() with an empty array.
   */
  let entries: CompetitionEntry[] = []

  if (
    stageCompetitionEntryIds.length > 0
  ) {
    const {
      data: entryData,
      error: entryError,
    } = await supabase
      .from("competition_entries")
      .select(entrySelect)
      .eq(
        "competition_id",
        stage.competitionId,
      )
      .eq(
        "status",
        "active",
      )
      .in(
        "id",
        stageCompetitionEntryIds,
      )
      .order(
        "sort_order",
        { ascending: true },
      )
      .order(
        "created_at",
        { ascending: true },
      )

    if (entryError) {
      throw new Error(
        entryError.message,
      )
    }

    entries =
      (entryData ??
        []) as CompetitionEntry[]
  }

  const matches =
    (matchData ??
      []) as MatchRow[]

  return new BracketViewBuilder().build({
    stage,
    entries,
    matches,
    seedsByEntryId,
  })
}