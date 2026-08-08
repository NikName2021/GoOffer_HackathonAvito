import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useState } from 'react'

import { RecapGiftIntro } from './RecapGiftIntro'
import { RecapViewer } from './RecapViewer'
import type { GetProfileResponse } from '@/types/profileResponse.type'
import type { RecapResponse } from '@/types/recap.type'

interface RecapExperienceProps {
  profile: GetProfileResponse
  recap: RecapResponse
}

function getOpenedStorageKey(profileId: string, year: number) {
  return `avito-recap-opened:${profileId}:${year}`
}

function wasRecapOpened(storageKey: string) {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(storageKey) === 'true'
  } catch {
    return false
  }
}

export function RecapExperience({ profile, recap }: RecapExperienceProps) {
  const storageKey = getOpenedStorageKey(profile.id, recap.year)
  const [opened, setOpened] = useState(() => wasRecapOpened(storageKey))
  const reduceMotion = useReducedMotion()
  const open = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, 'true')
    } catch {
      // The recap still opens when browser storage is unavailable.
    }
    setOpened(true)
  }, [storageKey])

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
