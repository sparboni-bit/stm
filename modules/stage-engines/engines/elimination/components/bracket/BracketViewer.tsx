import type { BracketViewModel } from "../../view"
import { DesktopBracketViewer } from "./DesktopBracketViewer"

type BracketViewerProps = { view: BracketViewModel }

export function BracketViewer({ view }: BracketViewerProps) {
  if (view.rounds.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
        <h3 className="text-base font-semibold text-slate-900">No bracket available</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Generate the Stage before opening the bracket.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Single elimination</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{view.stageName}</h2>
        </div>
        <div className="text-right text-xs font-semibold text-slate-500">
          <div>{view.rounds.length} rounds</div>
          <div>{view.matchCount} matches</div>
        </div>
      </header>

      <div className="md:hidden">
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mobile bracket navigation arrives in Sprint 7B.4C.
        </div>
      </div>

      <DesktopBracketViewer view={view} />
    </div>
  )
}
