import {
  loadStageEngine,
} from "../modules/stage-engines/core"

import type {
  CompetitionStage,
} from "../modules/competition-stages/types"

async function main() {
  const stage: CompetitionStage = {
    id: "stage-test",
    competitionId: "competition-test",
    name: "Main Draw",
    stageType: "elimination",
    status: "configured",
    sortOrder: 1,
    settings: {},
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const engine = loadStageEngine(stage)

  if (!engine.generate) {
    throw new Error(
      "Elimination generation is unavailable.",
    )
  }

  const result = await engine.generate({
    stage,
    entries: Array.from(
      { length: 8 },
      (_, index) => ({
        id: `entry-${index + 1}`,
        displayName: `Player ${index + 1}`,
        entryType: "player" as const,
        seed:
          index < 4
            ? index + 1
            : null,
        metadata: {},
      }),
    ),
    options: {
      drawMode: "seeded",
    },
  })

  console.dir(result, {
    depth: null,
  })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})