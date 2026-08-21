import { touchGuestDocument } from "../GuestTournamentDocument"
import { localStorageGuestAdapter } from "../storage/localStorageGuestAdapter"
import type { GuestTournamentDocument } from "../types"

export type GuestCollectionName =
  | "entries"
  | "stages"
  | "stageEntries"
  | "courts"
  | "matches"

type Item = { id: string }

export async function readGuestCollection<T extends Item>(
  competitionId: string,
  name: GuestCollectionName,
): Promise<T[]> {
  const document =
    await localStorageGuestAdapter.get(
      competitionId,
    )

  if (!document) {
    throw new Error(
      "Guest competition not found.",
    )
  }

  /*
   * The collection name is intentionally dynamic.
   * GuestTournamentDocument stores several different
   * item arrays under the supported collection keys.
   *
   * Callers provide the concrete collection item type,
   * therefore the conversion must pass through unknown
   * to avoid TypeScript treating the union of arrays as
   * structurally equivalent to every possible T[].
   */
  return document[name] as unknown as T[]
}

export async function replaceGuestCollection<
  T extends Item,
>(
  competitionId: string,
  name: GuestCollectionName,
  items: T[],
): Promise<void> {
  const current =
    await localStorageGuestAdapter.get(
      competitionId,
    )

  if (!current) {
    throw new Error(
      "Guest competition not found.",
    )
  }

  const next =
    touchGuestDocument({
      ...current,
      [name]: items,
    } as unknown as GuestTournamentDocument)

  await localStorageGuestAdapter.save(next)
}

export async function upsertGuestItem<
  T extends Item,
>(
  competitionId: string,
  name: GuestCollectionName,
  item: T,
): Promise<void> {
  const items =
    await readGuestCollection<T>(
      competitionId,
      name,
    )

  await replaceGuestCollection(
    competitionId,
    name,
    [
      ...items.filter(
        (current) =>
          current.id !== item.id,
      ),
      item,
    ],
  )
}

export async function removeGuestItem(
  competitionId: string,
  name: GuestCollectionName,
  id: string,
): Promise<void> {
  const items =
    await readGuestCollection<Item>(
      competitionId,
      name,
    )

  await replaceGuestCollection(
    competitionId,
    name,
    items.filter(
      (item) => item.id !== id,
    ),
  )
}
