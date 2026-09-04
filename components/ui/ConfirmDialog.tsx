"use client"

import {
  useEffect,
  useRef,
} from "react"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef =
    useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    cancelButtonRef.current?.focus()

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape" &&
        !pending
      ) {
        onCancel()
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [open, pending, onCancel])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !pending
        ) {
          onCancel()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg font-black text-red-700">
            !
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
              Destructive action
            </p>

            <h2
              id="confirm-dialog-title"
              className="mt-1 text-lg font-black text-slate-950"
            >
              {title}
            </h2>
          </div>
        </div>

        <p
          id="confirm-dialog-description"
          className="mt-4 text-sm leading-6 text-slate-600"
        >
          {description}
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-900">
          This action cannot be undone.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-600 bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? "Deleting..."
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
