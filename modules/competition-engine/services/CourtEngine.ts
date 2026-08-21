import type { Court } from "../domain/Court"

export class CourtEngine {
  normalize(courts: readonly Court[]): Court[] {
    return [...courts].sort(
      (a,b) => a.sortOrder - b.sortOrder || a.number - b.number,
    )
  }

  available(courts: readonly Court[]): Court[] {
    return this.normalize(courts.filter((court) => court.available))
  }

  assertUniqueNumbers(courts: readonly Court[]): void {
    const seen = new Set<number>()
    for (const court of courts) {
      if (seen.has(court.number)) {
        throw new Error(`Duplicate court number: ${court.number}`)
      }
      seen.add(court.number)
    }
  }
}
