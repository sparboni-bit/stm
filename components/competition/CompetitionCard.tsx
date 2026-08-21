import Link from "next/link"

import { Badge } from "@/components/ui/badge/Badge"
import { Card } from "@/components/ui/card/Card"

type CompetitionCardProps = {
  id: string
  title: string
  status: string
  updatedAt?: string | null
}


function getStatusVariant(
  status: string
): "neutral" | "info" | "success" | "warning" {
  if (status === "running") {
    return "success"
  }

  if (
    status === "ready" ||
    status === "generated"
  ) {
    return "info"
  }

  if (status === "configure") {
    return "warning"
  }

  return "neutral"
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    )
}

function formatUpdatedAt(value?: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function CompetitionCard({
  id,
  title,
  status,
  updatedAt,
}: CompetitionCardProps) {
  const formattedDate =
    formatUpdatedAt(updatedAt)

  return (
    <Link href={`/competitions/${id}`}>
      <Card
        interactive
        padding="none"
        className="h-full overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">
                🏆
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Competition
                </p>

                <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
                  {title}
                </h3>
              </div>
            </div>

            <Badge
              variant={getStatusVariant(status)}
              className="shrink-0"
            >
              {formatStatus(status)}
            </Badge>
          </div>

        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <span className="text-xs text-slate-500">
            {formattedDate
              ? `Updated ${formattedDate}`
              : "Competition workspace"}
          </span>

          <span className="text-sm font-semibold text-slate-900">
            Open →
          </span>
        </div>
      </Card>
    </Link>
  )
}