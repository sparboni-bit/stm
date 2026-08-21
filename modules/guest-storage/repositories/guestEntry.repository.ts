import { readGuestCollection, removeGuestItem, replaceGuestCollection, upsertGuestItem } from "./documentCollection"

const collection = "entries" as const

export const listGuestEntrys = <T extends { id: string }>(competitionId: string) => readGuestCollection<T>(competitionId, collection)
export const replaceGuestEntrys = <T extends { id: string }>(competitionId: string, items: T[]) => replaceGuestCollection(competitionId, collection, items)
export const upsertGuestEntry = <T extends { id: string }>(competitionId: string, item: T) => upsertGuestItem(competitionId, collection, item)
export const removeGuestEntry = (competitionId: string, id: string) => removeGuestItem(competitionId, collection, id)
