export const PlayMode = {
  Singles: "singles",
  Doubles: "doubles",
  IndividualDoubles: "individual_doubles",
} as const

export type PlayMode =
  (typeof PlayMode)[keyof typeof PlayMode]