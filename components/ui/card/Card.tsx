import type {
  HTMLAttributes,
  ReactNode,
} from "react"

type CardProps =
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode

    interactive?: boolean

    padding?: "none" | "sm" | "md" | "lg"

    shadow?: boolean
  }

export function Card({
  children,

  interactive = false,

  padding = "md",

  shadow = true,

  className,

  ...props
}: CardProps) {
  const paddingClass = {
    none: "",

    sm: "p-3",

    md: "p-5",

    lg: "p-7",
  }[padding]

  return (
    <div
      className={[
        "rounded-2xl border border-neutral-200 bg-white",

        shadow ? "shadow-sm" : "",

        interactive
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
          : "",

        paddingClass,

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