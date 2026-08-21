import { readGuestCollection, removeGuestItem, replaceGuestCollection, upsertGuestItem } from "./documentCollection"

const collection = "stageEntries" as const

export const listGuestStageEntrys = <T extends { id: string }>(competitionId: string) => readGuestCollection<T>(competitionId, collection)
export const replaceGuestStageEntrys = <T extends { id: string }>(competitionId: string, items: T[]) => replaceGuestCollection(competitionId, collection, items)
export const upsertGuestStageEntry = <T extends { id: string }>(competitionId: string, item: T) => upsertGuestItem(competitionId, collection, item)
export const removeGuestStageEntry = (competitionId: string, id: string) => removeGuestItem(competitionId, collection, id)
