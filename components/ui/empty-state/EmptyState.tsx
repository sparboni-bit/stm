import type {
  ReactNode,
} from "react"

import {
  Card,
} from "@/components/ui/card/Card"

import {
  CardContent,
} from "@/components/ui/card/CardContent"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center">
        {icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
            {icon}
          </div>
        )}

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}

        {action && (
          <div className="mt-5">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  )
}