import { Badge } from "@/components/ui/badge/Badge"
import { Card } from "@/components/ui/card/Card"

import type { CompetitionDetail } from "../types"

type Props = {
  competition: CompetitionDetail
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    draft: "Setup",
    configure: "Setup",
    ready: "Ready",
    generated: "Ready",
    running: "In progress",
    completed: "Completed",
    archived: "Archived",
  }

  return labels[value] ?? value.replaceAll("_", " ")
}

export function CompetitionHeader({
  competition,
}: Props) {
  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Tournament
          </p>

          <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {competition.title}
          </h1>

          {competition.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {competition.description}
            </p>
          )}
        </div>

        <Badge variant="info">
          {statusLabel(competition.status)}
        </Badge>
      </div>
    </Card>
  )
}
