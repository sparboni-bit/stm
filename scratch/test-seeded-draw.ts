import {
  SeededDrawStrategy,
} from "../modules/stage-engines/engines/elimination/draw"

import {
  BracketBuilder,
} from "../modules/stage-engines/engines/elimination/generator"

import type {
  BracketEntry,
} from "../modules/stage-engines/engines/elimination/domain"

const entries: BracketEntry[] = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `entry-${index + 1}`,
    name: `Player ${index + 1}`,
    type: "player",
    seed: index < 4 ? index + 1 : undefined,
  }),
)

const tree = new BracketBuilder().build(
  entries,
  new SeededDrawStrategy(),
)

const entryById = new Map(
  entries.map((entry) => [entry.id, entry]),
)

const firstRound = tree.rounds[0]

if (!firstRound) {
  throw new Error("First round not found.")
}

console.log("")
console.log(`BRACKET SIZE: ${tree.size}`)
console.log(`ROUND: ${firstRound.name}`)
console.log("")

firstRound.matches.forEach((match) => {
  const entryA =
    match.slotA.type === "entry" &&
    match.slotA.entryId
      ? entryById.get(match.slotA.entryId)
      : null

  const entryB =
    match.slotB.type === "entry" &&
    match.slotB.entryId
      ? entryById.get(match.slotB.entryId)
      : null

  console.log(
    `Match ${match.position}:`,
    `${entryA?.name ?? match.slotA.type}`,
    "vs",
    `${entryB?.name ?? match.slotB.type}`,
  )
})

console.log("")
console.log("SEEDED POSITIONS")

firstRound.matches.flatMap((match) => [
  match.slotA,
  match.slotB,
]).forEach((slot, index) => {
  if (
    slot.type !== "entry" ||
    !slot.entryId
  ) {
    return
  }

  const entry = entryById.get(slot.entryId)

  if (entry?.seed !== undefined) {
    console.log(
      `Seed ${entry.seed}: bracket position ${index + 1}`,
    )
  }
})