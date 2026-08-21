import type {
  HTMLAttributes,
  ReactNode,
} from "react"

type CardHeaderProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode
  }

export function CardHeader({
  children,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={[
        "border-b border-slate-100 p-5",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  )
}