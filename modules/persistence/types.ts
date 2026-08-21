export type PersistenceMode = "cloud" | "guest"

export type PersistenceContext =
  | { mode: "cloud" }
  | { mode: "guest"; competitionId?: string }

export function isGuestPersistence(
  context: PersistenceContext,
): context is Extract<PersistenceContext, { mode: "guest" }> {
  return context.mode === "guest"
}
