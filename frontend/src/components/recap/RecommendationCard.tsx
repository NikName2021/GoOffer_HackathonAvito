import { useState } from 'react'
import type { Recommendation } from '@/types/recap.type'

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleAction() {
    const cat = recommendation.category
    let msg = 'Открываем раздел Авито…'

    if (recommendation.code === 'browse_top_category' && cat) {
      msg = `Открываем категорию «${cat}»`
    } else if (recommendation.code === 'review_favorites') {
      msg = 'Открываем избранное'
    } else if (recommendation.code === 'post_listing') {
      msg = 'Переходим к подаче объявления'
    }

    setFeedback(msg)
    setTimeout(() => setFeedback(null), 2500)
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[#d6ebff] bg-[#f3faff] p-5">
      <p className="text-sm font-semibold text-[#00aaff]">Следующий шаг</p>
      <h3 className="mt-2 text-lg font-bold text-[#1f1f1f]">{recommendation.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[#6f7377]">{recommendation.description}</p>

      <button
        type="button"
        onClick={handleAction}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#00aaff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0090dd]"
      >
        {recommendation.action_label}
      </button>

      {feedback && (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-center text-sm font-medium text-[#00aaff]">
          {feedback}
        </p>
      )}
    </div>
  )
}