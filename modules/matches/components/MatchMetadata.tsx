import type { MatchDetailView } from "../view"

type MatchMetadataProps = {
  match: MatchDetailView
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function MatchMetadata({
  match,
}: MatchMetadataProps) {
  const items = [
    {
      label: "Scheduled",
      value: formatDate(match.scheduledAt),
    },
    {
      label: "Started",
      value: formatDate(match.startedAt),
    },
    {
      label: "Completed",
      value: formatDate(match.completedAt),
    },
    {
      label: "Finish type",
      value: match.finishType || "normal",
    },
  ]

  return (
    <section className="border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-950">
        Match information
      </h2>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="border border-slate-200 bg-slate-50 p-3"
          >
            <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {item.label}
            </dt>

            <dd className="mt-1 text-sm font-semibold text-slate-700">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
