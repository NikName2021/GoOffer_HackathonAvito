import { BookOpenText } from "lucide-react";

import { AchievementFieldGuide } from "@/components/documentation/AchievementFieldGuide";
import { DemoAccess } from "@/components/documentation/DemoAccess";
import { EditingGuide } from "@/components/documentation/EditingGuide";
import { MonitoringGallery } from "@/components/documentation/MonitoringGallery";
import { ProjectTeam } from "@/components/documentation/ProjectTeam";
import { UserJourney } from "@/components/documentation/UserJourney";
import { Sidebar } from "@/components/sidebar/Sidebar";

const links = [
  { href: "#achievement-fields", label: "Поля ачивок" },
  { href: "#team", label: "Команда" },
  { href: "#journey", label: "Путь пользователя" },
  { href: "#logic", label: "Как всё работает" },
  { href: "#monitoring", label: "Мониторинг" },
];

export function DocumentationPage() {
  return (
    <div className="flex min-h-dvh bg-white text-[#1f1f1f]">
      <Sidebar />
      <main className="min-w-0 flex-1 px-5 py-9 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1120px]">
          <header className="relative overflow-hidden rounded-[32px] bg-[#f2f9ff] px-6 py-9 sm:px-10 sm:py-12">
            <div className="relative z-10 max-w-3xl">
              <p className="flex items-center gap-2 text-sm font-bold text-[#00aaff]">
                <BookOpenText aria-hidden="true" className="size-4" />
                GoOffer · Итоги года
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Документация проекта
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f7377]">
                Краткий гид по команде, пользовательскому сценарию, данным
                итогов года, управлению карточками и инфраструктурному
                мониторингу.
              </p>
              <nav
                aria-label="Разделы документации"
                className="mt-7 flex flex-wrap gap-2"
              >
                {links.map((link) => (
                  <a
                    className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:text-[#00aaff]"
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <span className="absolute -right-20 -top-24 size-72 rounded-full bg-[#00aaff]/10" />
            <span className="absolute -bottom-28 right-32 size-56 rounded-full bg-[#965eeb]/10" />
          </header>

          <div className="mt-10 space-y-16 pb-12">
            <DemoAccess />
            <ProjectTeam />
            <UserJourney />
            <EditingGuide />
            <AchievementFieldGuide />
            <MonitoringGallery />
          </div>
        </div>
      </main>
    </div>
  );
}
