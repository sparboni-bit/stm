import { readGuestCollection, removeGuestItem, replaceGuestCollection, upsertGuestItem } from "./documentCollection"

const collection = "matches" as const

export const listGuestMatchs = <T extends { id: string }>(competitionId: string) => readGuestCollection<T>(competitionId, collection)
export const replaceGuestMatchs = <T extends { id: string }>(competitionId: string, items: T[]) => replaceGuestCollection(competitionId, collection, items)
export const upsertGuestMatch = <T extends { id: string }>(competitionId: string, item: T) => upsertGuestItem(competitionId, collection, item)
export const removeGuestMatch = (competitionId: string, id: string) => removeGuestItem(competitionId, collection, id)
