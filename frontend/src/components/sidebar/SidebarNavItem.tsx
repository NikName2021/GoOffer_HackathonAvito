import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  compact: boolean;
  end?: boolean;
  icon: LucideIcon;
  label: string;
  to: string;
}

export function SidebarNavItem({
  compact,
  end,
  icon: Icon,
  label,
  to,
}: SidebarNavItemProps) {
  return (
    <NavLink
      aria-label={label}
      className={({ isActive }) =>
        cn(
          "group relative flex min-h-12 items-center rounded-xl text-[#6f7377] transition-colors hover:bg-white hover:text-[#1f1f1f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00aaff]",
          compact
            ? "justify-center px-3"
            : "justify-center px-3 lg:justify-start lg:gap-4 lg:px-4",
          isActive && "bg-white font-semibold text-[#00aaff] shadow-sm",
        )
      }
      end={end}
      title={compact ? label : undefined}
      to={to}
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#00aaff] transition-opacity",
              isActive ? "opacity-100" : "opacity-0",
            )}
          />
          <Icon
            aria-hidden="true"
            className="size-6 shrink-0"
            strokeWidth={1.8}
          />
          {!compact && (
            <span className="hidden truncate text-[15px] lg:block">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}
