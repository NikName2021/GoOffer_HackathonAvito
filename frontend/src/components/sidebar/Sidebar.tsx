import {
  BookOpenText,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import favicon from "@/assets/avitoNotBackground.svg";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { PATHS } from "@/config/paths";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { ProfileAvatar } from "./ProfileAvatar";
import { SidebarNavItem } from "./SidebarNavItem";

export function Sidebar() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const account = useAppSelector((state) => state.auth.account);
  const displayName = account?.login ?? "Войти";

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 flex h-dvh w-[76px] shrink-0 flex-col overflow-hidden border-r border-[#e6e7e8] bg-[#f5f5f5] text-[#1f1f1f] transition-[width] duration-300",
          isCollapsed ? "lg:w-[80px]" : "lg:w-[264px]",
        )}
      >
        <Link
          aria-label="Итоги года"
          className={cn(
            "flex h-20 shrink-0 items-center border-b border-[#e6e7e8] px-5",
            isCollapsed ? "lg:justify-center" : "lg:gap-3",
          )}
          to={PATHS.HOME}
        >
          <img src={favicon} alt="" className="size-8 shrink-0" />
          {!isCollapsed && (
            <span className="ml-3 hidden whitespace-nowrap text-lg font-bold tracking-tight lg:block">
              Итоги года
            </span>
          )}
        </Link>

        <nav aria-label="Боковая навигация" className="space-y-2 px-3 py-7">
          <SidebarNavItem
            compact={isCollapsed}
            end
            icon={UsersRound}
            label="Мои профили"
            to={PATHS.HOME}
          />
          <SidebarNavItem
            compact={isCollapsed}
            icon={BookOpenText}
            label="Документация"
            to={PATHS.DOCUMENTATION}
          />
          {account?.isAdmin && (
            <SidebarNavItem
              compact={isCollapsed}
              icon={SlidersHorizontal}
              label="Настройка итогов года"
              to={PATHS.RECAP_SETTINGS}
            />
          )}
        </nav>

        <div className="mt-auto border-t border-[#e6e7e8] p-3">
          <ProfileAvatar
            compact={isCollapsed}
            isAuth={Boolean(account)}
            name={displayName}
            onClick={() => setIsAuthOpen(true)}
          />
        </div>

        <button
          aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          className="hidden h-14 shrink-0 items-center justify-center border-t border-[#e6e7e8] text-[#8a8d91] transition hover:bg-white hover:text-[#1f1f1f] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#00aaff] lg:flex"
          onClick={() => setIsCollapsed((current) => !current)}
          type="button"
        >
          {isCollapsed ? (
            <PanelLeftOpen aria-hidden="true" />
          ) : (
            <PanelLeftClose aria-hidden="true" />
          )}
        </button>
      </aside>

      <AuthDialog onOpenChange={setIsAuthOpen} open={isAuthOpen} />
    </>
  );
}
