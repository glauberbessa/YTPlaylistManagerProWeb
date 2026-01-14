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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UI_TEXT } from "@/lib/i18n";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Youtube className="h-8 w-8 text-primary" />
        <span className="text-lg font-bold">YTPM Pro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
