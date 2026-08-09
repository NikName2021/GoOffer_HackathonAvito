import { ChevronRight, UserIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  compact?: boolean;
  name: string;
  onClick: () => void;
  isAuth: boolean;
}

export function ProfileAvatar({
  compact,
  name,
  onClick,
  isAuth,
}: ProfileAvatarProps) {
  const initial = isAuth ? (
    name.slice(0, 1).toUpperCase() || "?"
  ) : (
    <UserIcon aria-hidden="true" className="size-6" />
  );

  return (
    <button
      aria-label={`Профиль: ${name}`}
      className={cn(
        "flex w-full cursor-pointer items-center rounded-xl text-left text-[#1f1f1f] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00aaff]",
        compact
          ? "justify-center p-2"
          : "justify-center p-2 lg:justify-start lg:gap-3 lg:p-3",
      )}
      onClick={onClick}
      type="button"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#00aaff] text-sm font-bold text-white">
        {initial}
      </span>
      {!compact && (
        <>
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block text-xs text-[#8a8d91]">
              {isAuth ? "Аккаунт" : "Авторизация"}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="hidden size-5 text-[#8a8d91] lg:block"
          />
        </>
      )}
    </button>
  );
}
