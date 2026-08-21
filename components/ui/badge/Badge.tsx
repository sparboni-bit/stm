import type {
  HTMLAttributes,
  ReactNode,
} from "react"

type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"

type BadgeProps =
  HTMLAttributes<HTMLSpanElement> & {
    children: ReactNode
    variant?: BadgeVariant
  }

const variantClasses: Record<
  BadgeVariant,
  string
> = {
  neutral:
    "border-slate-200 bg-slate-100 text-slate-700",

  info:
    "border-blue-200 bg-blue-50 text-blue-700",

  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  warning:
    "border-amber-200 bg-amber-50 text-amber-700",

  danger:
    "border-red-200 bg-red-50 text-red-700",
}

export function Badge({
  children,
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  )
}