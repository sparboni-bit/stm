import type { ReactNode } from "react"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}