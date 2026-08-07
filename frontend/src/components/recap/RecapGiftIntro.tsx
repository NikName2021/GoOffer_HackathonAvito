import { Gift, Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

import { RecapGiftCracks } from './RecapGiftCracks'
import type { GetProfileResponse } from '@/types/profileResponse.type'

const confettiColors = ['#00aaff', '#965eeb', '#00c565', '#ff4053', '#ff9f1a']
const hitMessages = [
  'Нажмите на посылку',
  'Первая трещина! Нажмите ещё',
  'Коробка уже поддаётся',
  'Ещё один удар!',
  'Открываем ваши итоги…',
]
const requiredHits = 4

interface RecapGiftIntroProps {
  onOpen: () => void
  profile: GetProfileResponse
  year: number
}

export function RecapGiftIntro({ onOpen, profile, year }: RecapGiftIntroProps) {
  const [hits, setHits] = useState(0)
  const [opening, setOpening] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (hits < requiredHits || opening) return
    const timeout = window.setTimeout(() => setOpening(true), reduceMotion ? 0 : 280)
    return () => window.clearTimeout(timeout)
  }, [hits, opening, reduceMotion])

  useEffect(() => {
    if (!opening) return
    const timeout = window.setTimeout(onOpen, reduceMotion ? 150 : 1050)
    return () => window.clearTimeout(timeout)
  }, [onOpen, opening, reduceMotion])

  return (
    <motion.section
      animate={{ opacity: 1 }}
      className="relative grid h-full overflow-hidden bg-[#15121f] px-5 py-8 text-white sm:rounded-[32px]"
      exit={{ filter: 'blur(14px)', opacity: 0, scale: 1.08 }}
      initial={{ opacity: 0 }}
    >
      <motion.div animate={{ rotate: 360 }} className="absolute -top-40 -left-28 size-[420px] rounded-[42%] bg-[#965eeb]/35 blur-3xl" transition={{ duration: 26, ease: 'linear', repeat: Infinity }} />
      <motion.div animate={{ x: [0, 50, 0], y: [0, -35, 0] }} className="absolute right-[-100px] bottom-[-80px] size-96 rounded-full bg-[#00aaff]/30 blur-3xl" transition={{ duration: 9, ease: 'easeInOut', repeat: Infinity }} />
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center justify-center text-center">
        <motion.div animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl" initial={{ opacity: 0, y: -16 }} transition={{ delay: 0.15 }}>
          <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-[#00c565] text-xs font-black">
            {profile.avatarUrl ? <img alt="" className="size-full object-cover" src={profile.avatarUrl} /> : profile.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-sm font-bold">Для {profile.name}</span>
        </motion.div>

        <motion.p animate={{ opacity: 1 }} className="text-xs font-bold tracking-[0.22em] text-[#75d6ff] uppercase" initial={{ opacity: 0 }} transition={{ delay: 0.25 }}>Avito · {year}</motion.p>
        <motion.h2 animate={{ opacity: 1, y: 0 }} className="mt-3 text-3xl leading-none font-black tracking-[-0.04em] sm:text-5xl" initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.3 }}>Ваш год уже<br />внутри</motion.h2>
        <motion.p animate={{ opacity: 1 }} className="mt-4 max-w-sm text-sm leading-6 text-white/65" initial={{ opacity: 0 }} transition={{ delay: 0.45 }}>Мы собрали находки, сделки и моменты, которыми хочется поделиться.</motion.p>

        <motion.button
          animate={opening || reduceMotion || hits === 0 ? undefined : {
            rotate: [0, -hits * 0.7, hits * 0.55, -hits * 0.3, 0],
            x: [0, -hits * 3, hits * 3, -hits * 1.5, 0],
          }}
          aria-label="Распаковать итоги года"
          className="group relative mt-3 h-64 w-[min(88vw,420px)] cursor-pointer [perspective:1000px] will-change-transform"
          disabled={opening}
          onClick={() => setHits((current) => Math.min(current + 1, requiredHits))}
          type="button"
          whileHover={reduceMotion ? undefined : { rotateX: -4, rotateY: 5, scale: 1.035 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.span animate={opening ? { opacity: 0, rotate: -14, y: -160 } : { y: [0, -8, 0] }} className="absolute top-5 left-2 z-20 h-20 w-[calc(100%-1rem)] rounded-[24px] bg-gradient-to-r from-[#00aaff] via-[#5ac8fa] to-[#00c565] shadow-[0_22px_50px_rgba(0,170,255,0.35)] will-change-transform" transition={opening ? { duration: 0.55, ease: 'easeOut' } : { duration: 2.4, repeat: Infinity }} />
          <motion.span animate={opening ? { scaleY: 0, y: -60 } : {}} className="absolute top-0 left-1/2 z-30 h-28 w-16 -translate-x-1/2 rounded-2xl bg-[#ff4053] shadow-lg will-change-transform" transition={{ duration: 0.45 }} />
          <motion.span animate={opening ? { opacity: 0, scale: 0.66, y: 90 } : {}} className="absolute top-20 left-0 h-44 w-full overflow-hidden rounded-[34px] border border-white/25 bg-gradient-to-br from-[#f8f5ff] to-[#e9ddff] shadow-[0_36px_80px_rgba(0,0,0,0.45)] will-change-transform" transition={{ delay: 0.08, duration: 0.55 }}>
            <span className="absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 bg-[#ff4053]" />
            <span className="absolute bottom-7 left-7 rounded-2xl bg-white px-5 py-4 text-left text-[#1f1f1f] shadow-sm"><b className="block text-base">Итоги {year}</b><small className="text-[#8a8d91]">Только для вас</small></span>
            <Gift className="absolute right-9 bottom-8 size-11 text-[#965eeb]" />
            <RecapGiftCracks hits={hits} />
          </motion.span>

          <AnimatePresence>
            {opening && Array.from({ length: 14 }, (_, index) => (
              <motion.i
                animate={{ opacity: [0, 1, 0], rotate: index * 55, x: Math.cos(index) * (110 + index * 8), y: -90 - (index % 5) * 38 }}
                className="absolute top-1/2 left-1/2 z-40 h-3 w-2 rounded-sm"
                initial={{ opacity: 0, x: 0, y: 0 }}
                key={index}
                style={{ backgroundColor: confettiColors[index % confettiColors.length] }}
                transition={{ delay: index * 0.015, duration: 0.85, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>
        </motion.button>

        <div aria-live="polite" className="flex flex-col items-center gap-2">
          <motion.span animate={{ opacity: opening ? 0 : [0.78, 1, 0.78] }} className="inline-flex items-center gap-2 text-sm font-bold text-white/90" transition={{ duration: 2, repeat: Infinity }}><Sparkles className="size-4 text-[#ffcf40]" />{hitMessages[hits]}</motion.span>
          <div className="flex gap-1.5" role="presentation">
            {Array.from({ length: requiredHits }, (_, index) => <motion.i animate={{ backgroundColor: index < hits ? '#00aaff' : 'rgba(255,255,255,.2)', scale: index < hits ? 1.18 : 1 }} className="size-1.5 rounded-full" key={index} />)}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
