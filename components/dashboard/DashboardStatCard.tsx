type DashboardStatCardProps = {
  label: string
  value: number
  description: string
  icon: string
}

export function DashboardStatCard({
  label,
  value,
  description,
  icon,
}: DashboardStatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl"
        >
          {icon}
        </span>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {description}
      </p>
    </article>
  )
}