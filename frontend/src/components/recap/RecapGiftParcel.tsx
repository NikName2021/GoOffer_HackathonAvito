import { motion } from 'motion/react'

import { RecapGiftCracks } from './RecapGiftCracks'

interface RecapGiftParcelProps {
  hits: number
  opening: boolean
  reduceMotion: boolean | null
}

export function RecapGiftParcel({ hits, opening, reduceMotion }: RecapGiftParcelProps) {
  const lidAnimation = opening ? { opacity: 0, rotate: -14, y: -160 } : { y: [0, -8, 0] }

  return (
    <>
      <span className="absolute top-[92px] left-4 h-40 w-[calc(100%-2rem)] rounded-[36px] bg-[#a99bd5] opacity-65 shadow-[0_30px_65px_rgba(0,0,0,.55)]" />
      <span className="absolute bottom-1 left-1/2 h-7 w-[84%] -translate-x-1/2 rounded-full bg-black/45 blur-xl" />

      <motion.span animate={lidAnimation} className="absolute top-5 left-2 z-20 h-20 w-[calc(100%-1rem)] overflow-hidden rounded-[26px] border border-white/35 bg-gradient-to-b from-[#55d5f1] via-[#35bfe3] to-[#20acd4] shadow-[0_20px_45px_rgba(0,170,255,.32),inset_0_2px_1px_rgba(255,255,255,.55),inset_0_-8px_16px_rgba(2,112,154,.18)] will-change-transform" transition={opening ? { duration: 0.55, ease: 'easeOut' } : { duration: reduceMotion ? 0 : 2.4, repeat: Infinity }}>
        <span className="absolute inset-x-5 top-2 h-px rounded-full bg-white/65" />
        <span className="absolute right-0 bottom-0 h-full w-1/3 bg-gradient-to-l from-[#00c565]/70 to-transparent" />
        <motion.i animate={reduceMotion ? undefined : { x: [-100, 480] }} className="absolute inset-y-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-sm" transition={{ duration: 4.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.8 }} />
      </motion.span>

      <motion.span animate={opening ? { opacity: 0, rotate: 24, scale: 0.65, x: 85, y: -145 } : {}} className="absolute top-0 left-1/2 z-40 -translate-x-1/2 will-change-transform" transition={{ duration: 0.5 }}>
        <i className="absolute top-2 -left-[76px] h-12 w-24 -rotate-[24deg] rounded-[65%_40%_58%_42%] border border-white/25 bg-gradient-to-br from-[#ff8290] via-[#ff5264] to-[#d9283c] shadow-[inset_-8px_-6px_12px_rgba(128,9,28,.2),0_9px_18px_rgba(0,0,0,.25)]" />
        <i className="absolute top-2 -left-5 h-12 w-24 rotate-[24deg] rounded-[40%_65%_42%_58%] border border-white/25 bg-gradient-to-bl from-[#ff8290] via-[#ff5264] to-[#d9283c] shadow-[inset_8px_-6px_12px_rgba(128,9,28,.2),0_9px_18px_rgba(0,0,0,.25)]" />
        <i className="absolute top-7 -left-10 h-16 w-8 rotate-12 bg-gradient-to-r from-[#d9283c] to-[#ff5869] [clip-path:polygon(0_0,100%_0,82%_100%,50%_80%,18%_100%)]" />
        <i className="absolute top-7 left-1 h-16 w-8 -rotate-12 bg-gradient-to-l from-[#d9283c] to-[#ff5869] [clip-path:polygon(0_0,100%_0,82%_100%,50%_80%,18%_100%)]" />
        <i className="absolute top-4 -left-8 size-16 rounded-[22px] border border-white/30 bg-gradient-to-br from-[#ff7b89] via-[#ff4053] to-[#cf1f34] shadow-[inset_4px_4px_8px_rgba(255,255,255,.22),0_9px_20px_rgba(143,13,34,.35)]" />
      </motion.span>

      <motion.span animate={opening ? { opacity: 0, scale: 0.66, y: 90 } : {}} className="absolute top-20 left-0 h-44 w-full overflow-hidden rounded-[36px] border border-white/55 bg-gradient-to-br from-[#fbfdff] via-[#eeeaff] to-[#d9ceff] shadow-[0_36px_80px_rgba(0,0,0,.46),inset_0_12px_18px_rgba(154,130,225,.12),inset_-12px_0_22px_rgba(111,83,192,.1)] will-change-transform" transition={{ delay: 0.08, duration: 0.55 }}>
        <span className="absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 bg-gradient-to-r from-[#d8273d] via-[#ff5365] to-[#d8273d] shadow-[inset_5px_0_8px_rgba(255,255,255,.18),6px_0_14px_rgba(96,43,91,.12)]" />
        <span className="absolute inset-x-8 top-3 h-px bg-white/80" />
        <span className="absolute right-3 bottom-5 h-28 w-7 rounded-full bg-[#9a83d8]/10 blur-lg" />
        <span className="absolute bottom-0 left-10 h-4 w-3/4 rounded-t-full bg-white/35 blur-md" />
        <RecapGiftCracks hits={hits} />
      </motion.span>
    </>
  )
}
