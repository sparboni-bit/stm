import {
  Competition,
  CompetitionEntry,
  Court,
  Stage,
} from "."

export interface CompetitionAggregate {
  competition: Competition

  entries: CompetitionEntry[]

  stages: Stage[]

  courts: Court[]
}