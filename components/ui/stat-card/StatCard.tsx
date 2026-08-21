import type { ReactNode } from "react"

import { Card } from "@/components/ui/card/Card"

type StatCardProps = {
  label: string
  value: number | string
  description?: string
  icon?: ReactNode
}

export function StatCard({
  label,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <Card
      padding="md"
      className="relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-700">
            {icon}
          </div>
        )}
      </div>

      {description && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </Card>
  )
}