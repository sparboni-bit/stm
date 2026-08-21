import type {
  CompetitionStatisticsView,
} from "../view-models/competition-statistics"

type Props = {
  statistics: CompetitionStatisticsView
}

export function CompetitionStatistics({
  statistics,
}: Props) {
  const items = [
    {
      label: "Players",
      value: statistics.players,
    },
    {
      label: "Teams",
      value: statistics.teams,
    },
    {
      label: "Matches",
      value: statistics.matches,
    },
    {
      label: "Courts",
      value: statistics.courts,
    },
  ]

  return (
    <div className="grid grid-cols-4 divide-x divide-slate-200 border border-slate-200 bg-white shadow-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 px-2 py-3 text-center sm:px-4 sm:py-4"
        >
          <div className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs">
            {item.label}
          </div>

          <div className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
