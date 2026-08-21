import type {
  HTMLAttributes,
  ReactNode,
} from "react"

type CardContentProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode
  }

export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div
      className={[
        "p-5",
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