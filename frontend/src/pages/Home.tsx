import { AddProfileButton } from '@/components/profileCards/AddProfileButton'
import { ProfileCard } from '@/components/profileCards/ProfileCard'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { TEST_PROFILES } from '@/constants/testProfiles'

export function HomePage() {
  return (
    <div className="flex min-h-dvh bg-white text-[#1f1f1f]">
      <Sidebar />

      <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-16">
        <div className="mx-auto max-w-[1120px]">
          <header>
            <p className="text-sm font-semibold text-[#00aaff]">Авито · 2026</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#1f1f1f] sm:text-4xl">
              Чьи итоги посмотрим?
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f7377] sm:text-base">
              Выберите тестовый профиль, чтобы собрать персональную историю года на основе его активности.
            </p>
          </header>

          <section aria-label="Тестовые профили" className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {TEST_PROFILES.map((profile) => (
              <ProfileCard key={profile.name} profile={profile} />
            ))}
            <AddProfileButton />
          </section>
        </div>
      </main>
    </div>
  )
}
