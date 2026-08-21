"use server"

import { loadBracketView } from "../repositories/loadBracketView"
import type { BracketViewModel } from "../view"

export async function getEliminationReportViewAction(
  stageId: string,
): Promise<BracketViewModel | null> {
  return loadBracketView(stageId)
}
