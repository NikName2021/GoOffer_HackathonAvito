import { BookOpenText, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import favicon from "@/assets/avitoNotBackground.svg";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { PATHS } from "@/config/paths";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { ProfileAvatar } from "./ProfileAvatar";

export function Sidebar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const account = useAppSelector((state) => state.auth.account);
  const displayName = account?.login ?? "Войти";

  return (
    <>
      <aside className="sticky top-0 flex h-dvh w-[82px] shrink-0 flex-col border-r border-[#e6e7e8] bg-[#f5f5f5] px-3 py-6 lg:w-[236px] lg:px-5">
        <Link className="flex items-center gap-3 px-2" to={PATHS.HOME}>
          <img src={favicon} alt="Логотип" className="size-7" />
          <span className="hidden text-base font-bold tracking-tight text-[#1f1f1f] lg:block">
            Итоги года
          </span>
        </Link>

        <nav aria-label="Боковая навигация" className="mt-12 space-y-2">
          <NavLink
            aria-label="Документация"
            className={({ isActive }) =>
              cn(
                "flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-[#6f7377] transition hover:bg-white hover:text-[#1f1f1f] lg:justify-start",
                isActive && "bg-white font-semibold text-[#00aaff] shadow-sm",
              )
            }
            title="Документация"
            to={PATHS.DOCUMENTATION}
          >
            <BookOpenText
              aria-hidden="true"
              className="size-5"
              strokeWidth={1.8}
            />
            <span className="hidden text-sm font-medium lg:block">
              Документация
            </span>
          </NavLink>
          {account?.isAdmin && (
            <NavLink
              aria-label="Настройка итогов года"
              className={({ isActive }) =>
                cn(
                  "flex w-full items-center justify-center gap-3 rounded-xl px-3 py-3 text-[#6f7377] transition hover:bg-white hover:text-[#1f1f1f] lg:justify-start",
                  isActive && "bg-white font-semibold text-[#00aaff] shadow-sm",
                )
              }
              reloadDocument
              title="Настройка итогов года"
              to={PATHS.RECAP_SETTINGS}
            >
              <SlidersHorizontal
                aria-hidden="true"
                className="size-5"
                strokeWidth={1.8}
              />
              <span className="hidden text-sm font-medium lg:block">
                Настройка итогов года
              </span>
            </NavLink>
          )}
        </nav>

        <div className="mt-auto">
          <ProfileAvatar
            name={displayName}
            onClick={() => setIsAuthOpen(true)}
            isAuth={!!account}
          />
        </div>
      </aside>

      <AuthDialog onOpenChange={setIsAuthOpen} open={isAuthOpen} />
    </>
  );
}
