import { createClient } from "@/lib/supabase/server"

import type {
  BracketMapperResult,
} from "../mappers"

export type PersistEliminationBracketInput = {
  stageId: string
  mapped: BracketMapperResult
}

/**
 * Persists a complete Elimination bracket atomically.
 *
 * PostgreSQL is responsible for:
 * - validating the Stage;
 * - preventing duplicate generation;
 * - inserting all matches;
 * - updating Stage status;
 * - merging bracket metadata.
 */
export async function persistEliminationBracket(
  input: PersistEliminationBracketInput,
): Promise<void> {
  const stageId = input.stageId.trim()

  if (!stageId) {
    throw new Error("Stage id is required.")
  }

  if (input.mapped.matches.length === 0) {
    throw new Error(
      "The Elimination bracket contains no matches.",
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc(
    "persist_elimination_bracket",
    {
      p_stage_id: stageId,
      p_matches: input.mapped.matches,
      p_metadata: input.mapped.stageMetadata,
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}