type StageSectionPlaceholderProps = {
  title: string
  description: string
}

export function StageSectionPlaceholder({
  title,
  description,
}: StageSectionPlaceholderProps) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Stage section
      </p>

      <h2 className="mt-1 text-xl font-semibold text-slate-950">
        {title}
      </h2>

      <div className="mt-5 border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
        <p className="text-base font-semibold text-slate-900">
          {title} foundation ready
        </p>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </section>
  )
}
