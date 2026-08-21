import type {
  HTMLAttributes,
  ReactNode,
} from "react"

type CardFooterProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode
  }

export function CardFooter({
  children,
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={[
        "border-t border-slate-100 p-5",
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