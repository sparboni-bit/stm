import type {
  ReactNode,
} from "react"

type SectionHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
}

export function SectionHeader({
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
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
  )
}