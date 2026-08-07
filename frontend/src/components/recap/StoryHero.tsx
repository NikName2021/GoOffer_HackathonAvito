import type { Story } from '@/types/recap.type'
import { PersonaBadge } from '@/components/recap/PersonaBadge'

export function StoryHero({
  story,
  year,
  name,
}: {
  story: Story
  year: number
  name?: string
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#00aaff] via-[#3b82f6] to-[#965eeb] p-8 text-white shadow-lg sm:p-10">
      <div className="flex flex-wrap items-center gap-2">
        <PersonaBadge
          persona={story.persona}
          size="large"
          className="!border-white/30 !bg-white/20 !text-white backdrop-blur-sm"
        />
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
          {year}
        </span>
        {name ? (
          <span className="text-sm font-medium text-white/90">{name}</span>
        ) : null}
      </div>

      <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
        {story.headline}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
        {story.summary}
      </p>
    </section>
  )
}
