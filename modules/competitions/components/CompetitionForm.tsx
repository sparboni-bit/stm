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
          Competition Name
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

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
        >
          Create Competition
        </button>
      </div>
    </form>
  )
}
