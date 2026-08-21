export function mapCompetition(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    playMode: row.play_mode,
    structureType: row.structure_type,
    status: row.status,
    ownerMemberId: row.owner_member_id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}