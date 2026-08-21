import { readGuestCollection, removeGuestItem, replaceGuestCollection, upsertGuestItem } from "./documentCollection"

const collection = "stages" as const

export const listGuestStages = <T extends { id: string }>(competitionId: string) => readGuestCollection<T>(competitionId, collection)
export const replaceGuestStages = <T extends { id: string }>(competitionId: string, items: T[]) => replaceGuestCollection(competitionId, collection, items)
export const upsertGuestStage = <T extends { id: string }>(competitionId: string, item: T) => upsertGuestItem(competitionId, collection, item)
export const removeGuestStage = (competitionId: string, id: string) => removeGuestItem(competitionId, collection, id)
