import Link from "next/link"

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react"

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"

type ButtonSize =
  | "sm"
  | "md"
  | "lg"

type SharedProps = {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

type NativeButtonProps =
  SharedProps &
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      "className" | "children"
    > & {
      href?: never
    }

type LinkButtonProps =
  SharedProps &
    Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      "href" | "className" | "children"
    > & {
      href: string
    }

type ButtonProps =
  | NativeButtonProps
  | LinkButtonProps

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary:
    "bg-[var(--arena-yellow)] text-[var(--arena-black)] hover:brightness-95 focus-visible:ring-[var(--arena-yellow)]",

  secondary:
    "border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50 focus-visible:ring-neutral-300",

  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",

  ghost:
    "bg-transparent text-neutral-800 hover:bg-neutral-100 focus-visible:ring-neutral-300",
}

const sizeClasses: Record<
  ButtonSize,
  string
> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3.5 text-base",
}

function buildClassName({
  variant,
  size,
  fullWidth,
  className,
}: {
  variant: ButtonVariant
  size: ButtonSize
  fullWidth: boolean
  className?: string
}) {
  return [
    "inline-flex items-center justify-center rounded-xl font-semibold transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ")
}

function isLinkButton(
  props: ButtonProps
): props is LinkButtonProps {
  return typeof props.href === "string"
}

export function Button(
  props: ButtonProps
) {
  const {
    children,
    variant = "primary",
    size = "md",
    fullWidth = false,
    className,
  } = props

  const resolvedClassName =
    buildClassName({
      variant,
      size,
      fullWidth,
      className,
    })

  if (isLinkButton(props)) {
    const {
      href,
      children: _children,
      variant: _variant,
      size: _size,
      fullWidth: _fullWidth,
      className: _className,
      ...linkProps
    } = props

    return (
      <Link
        href={href}
        className={resolvedClassName}
        {...linkProps}
      >
        {children}
      </Link>
    )
  }

  const {
    children: _children,
    variant: _variant,
    size: _size,
    fullWidth: _fullWidth,
    className: _className,
    type = "button",
    ...buttonProps
  } = props

  return (
    <button
      type={type}
      className={resolvedClassName}
      {...buttonProps}
    >
      {children}
    </button>
  )
}