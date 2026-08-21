import {
  Competition,
  CompetitionAggregate,
} from "../domain"

export interface CompetitionEngineRepository {
  getCompetition(
    competitionId: string,
  ): Promise<Competition | null>

  getCompetitionAggregate(
    competitionId: string,
  ): Promise<CompetitionAggregate | null>

  saveCompetition(
    competition: Competition,
  ): Promise<void>

  deleteCompetition(
    competitionId: string,
  ): Promise<void>
}