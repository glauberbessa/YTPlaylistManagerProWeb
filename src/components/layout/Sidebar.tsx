"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListVideo,
  Radio,
  Settings,
  Settings2,
  Gauge,
  Youtube,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "./SidebarContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navigation = [
  {
    name: UI_TEXT.nav.playlists,
    href: "/playlists",
    icon: ListVideo,
  },
  {
    name: UI_TEXT.nav.channels,
    href: "/channels",
    icon: Radio,
  },
  {
    name: UI_TEXT.nav.configPlaylists,
    href: "/config/playlists",
    icon: Settings,
  },
  {
    name: UI_TEXT.nav.configChannels,
    href: "/config/channels",
    icon: Settings2,
  },
  {
    name: UI_TEXT.nav.quota,
    href: "/quota",
    icon: Gauge,
  },
];

interface SidebarProps {
  showToggle?: boolean;
}

export function Sidebar({ showToggle = true }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, setCollapsed, autoCollapse, setAutoCollapse } =
    useSidebar();

  const handleLinkClick = () => {
    if (autoCollapse && !isCollapsed) {
      setCollapsed(true);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex h-full flex-col border-r bg-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Youtube className="h-8 w-8 text-primary shrink-0" />
          {!isCollapsed && <span className="text-lg font-bold">YTPM Pro</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        <div className="border-t p-2 space-y-2">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            {!isCollapsed && (
              <span className="text-xs text-muted-foreground">Auto colapsar</span>
            )}
            <Switch
              checked={autoCollapse}
              onCheckedChange={setAutoCollapse}
              aria-label="Auto colapsar menu lateral"
            />
          </div>

          {/* Toggle Button */}
          {showToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className={cn("w-full", isCollapsed && "px-2")}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Recolher
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Expandir menu</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
