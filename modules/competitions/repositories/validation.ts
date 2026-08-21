export function validateCompetition(data: {
  title: string
  playMode: string
  structureType: string
}) {
  const errors: string[] = []

  if (!data.title.trim()) {
    errors.push("Title is required")
  }

  if (!data.playMode) {
    errors.push("Play mode is required")
  }

  if (!data.structureType) {
    errors.push("Structure type is required")
  }

  return errors
}