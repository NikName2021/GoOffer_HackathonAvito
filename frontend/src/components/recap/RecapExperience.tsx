import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { RecapGiftIntro } from './RecapGiftIntro'
import { RecapViewer } from './RecapViewer'
import { sendRecapEvent } from '@/api/recapEvents'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import type { RecapResponse } from '@/types/recap.type'
import { markRecapOpened, wasRecapOpened } from '@/utils/recapStorage'

interface RecapExperienceProps {
  profile: GetProfileResponse
  recap: RecapResponse
}

export function RecapExperience({ profile, recap }: RecapExperienceProps) {
  const [opened, setOpened] = useState(() => wasRecapOpened(profile.id, recap.year))
  const reduceMotion = useReducedMotion()
  const recapOpenedSent = useRef(false)
  const giftOpenedSent = useRef(false)

  useEffect(() => {
    if (recapOpenedSent.current) return
    recapOpenedSent.current = true
    void sendRecapEvent({ event: 'recap_opened' })
  }, [])

  const open = useCallback(() => {
    if (!giftOpenedSent.current) {
      giftOpenedSent.current = true
      void sendRecapEvent({ event: 'gift_opened' })
    }
    markRecapOpened(profile.id, recap.year)
    setOpened(true)
  }, [profile.id, recap.year])

  return (
    <AnimatePresence initial={false} mode="wait">
      {!opened ? (
        <RecapGiftIntro key="gift" onOpen={open} profile={profile} year={recap.year} />
      ) : (
        <motion.div
          animate={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
          className="h-full"
          initial={reduceMotion ? false : { filter: 'blur(16px)', opacity: 0, scale: 0.94 }}
          key="recap"
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <RecapViewer profile={profile} recap={recap} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
