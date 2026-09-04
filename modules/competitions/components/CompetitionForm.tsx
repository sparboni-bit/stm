"use client"

import { createCompetitionAction } from "../actions/createCompetition"

export function CompetitionForm() {
  return (
    <form
      action={createCompetitionAction}
      className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="competition-title"
          className="mb-2 block text-sm font-semibold"
        >
          Event Name
        </label>

        <input
          id="competition-title"
          name="title"
          required
          maxLength={150}
          className="w-full rounded-xl border px-4 py-3"
        />
      </div>

      <div>
        <label
          htmlFor="competition-description"
          className="mb-2 block text-sm font-semibold"
        >
          Description
        </label>

        <textarea
          id="competition-description"
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="Optional description"
          className="w-full resize-y rounded-xl border px-4 py-3"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="competition-start-date"
            className="mb-2 block text-sm font-semibold"
          >
            Date From
          </label>

          <input
            id="competition-start-date"
            name="start_date"
            type="date"
            onClick={(event) => {
              event.currentTarget.showPicker?.()
            }}
            required
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label
            htmlFor="competition-end-date"
            className="mb-2 block text-sm font-semibold"
          >
            Date To
          </label>

          <input
            id="competition-end-date"
            name="end_date"
            type="date"
            onClick={(event) => {
              event.currentTarget.showPicker?.()
            }}
            className="w-full rounded-xl border px-4 py-3"
          />

          <p className="mt-1 text-xs text-slate-500">
            Optional for a one-day event.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
        >
          Create Event
        </button>
      </div>
    </form>
  )
}
