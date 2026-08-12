import { motion, useReducedMotion } from 'motion/react'

import { RecapMission } from './RecapMission'

interface RecapMissionSlideProps {
  profileId: string
  year: number
}

export function RecapMissionSlide({ profileId, year }: RecapMissionSlideProps) {
  const reduceMotion = useReducedMotion()

  return (
    <article className="relative h-full overflow-x-hidden overflow-y-auto rounded-[32px] border border-white/80 bg-[linear-gradient(145deg,#e5f7ff_0%,#f7fbff_45%,#f0e8ff_100%)] p-5 shadow-[0_24px_70px_rgba(31,31,31,0.12)] sm:p-7">
      <motion.div
        animate={reduceMotion ? undefined : { rotate: [0, 8, -5, 0], scale: [1, 1.08, 1] }}
        className="absolute -top-20 -right-16 size-64 rounded-full bg-[#965eeb]/15 blur-2xl"
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -12, 0] }}
        className="absolute bottom-0 -left-20 size-56 rounded-full bg-[#00d667]/15 blur-2xl"
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <span className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#965eeb] shadow-sm backdrop-blur">
          Новая глава
        </span>
        <h2 className="mt-3 max-w-2xl text-3xl leading-none font-black tracking-[-0.045em] text-[#1f1f1f] sm:text-5xl">
          Следующий год начинается сейчас
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6f7377] sm:text-base">
          Выберите до трёх целей. Мы сохраним их и будем отмечать прогресс по вашей активности на Авито.
        </p>
        <RecapMission profileId={profileId} year={year} />
      </div>
    </article>
  )
}
