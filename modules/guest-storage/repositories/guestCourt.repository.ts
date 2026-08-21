import { readGuestCollection, removeGuestItem, replaceGuestCollection, upsertGuestItem } from "./documentCollection"

const collection = "courts" as const

export const listGuestCourts = <T extends { id: string }>(competitionId: string) => readGuestCollection<T>(competitionId, collection)
export const replaceGuestCourts = <T extends { id: string }>(competitionId: string, items: T[]) => replaceGuestCollection(competitionId, collection, items)
export const upsertGuestCourt = <T extends { id: string }>(competitionId: string, item: T) => upsertGuestItem(competitionId, collection, item)
export const removeGuestCourt = (competitionId: string, id: string) => removeGuestItem(competitionId, collection, id)
