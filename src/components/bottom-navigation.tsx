"use client";

import { Button } from "@/components/ui/button";
import { Role } from "@/types";
import {
  FileText,
  Home,
  QrCode,
  Settings,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NavItem {
  id: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  shortLabel?: string; // For very small screens
  href: string;
  role: Role[];
}

interface NavItemProps {
  item: NavItem;
  className?: string;
}

function NavItem({ item, className = "" }: NavItemProps) {
  const Icon = item.icon;
  return (
    <Button
      asChild
      key={item.id}
      variant="ghost"
      size="sm"
      className={`hover:bg-accent/50 relative flex h-auto flex-col items-center justify-center space-y-0.5 py-2 ${"text-muted-foreground hover:text-foreground"} ${className}`}
    >
      <Link
        href={item.href}
        className="flex grow flex-col items-center justify-center space-y-0.5"
      >
        <div className="relative">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="w-full truncate text-center text-[10px] leading-tight font-medium sm:text-xs">
          <span className="xs:inline hidden">{item.label}</span>
          <span className="xs:hidden">{item.shortLabel || item.label}</span>
        </span>
      </Link>
    </Button>
  );
}

interface Props {
  role?: Role;
}

export function BottomNavigation({ role }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) return null;
  const navItems: NavItem[] = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      href: "/",
      role: ["student", "lecturer", "admin"],
    },
    {
      id: "attendance-tracking",
      icon: UserCheck,
      label: "Attendance Tracking",
      shortLabel: "Attendance",
      href: "/attendance-tracking",
      role: ["lecturer"],
    },
    {
      id: "qr-generation",
      icon: QrCode,
      label: "QR Code Generation",
      shortLabel: "QR",
      href: "/qr-generation",
      role: ["lecturer"],
    },
    {
      id: "records",
      icon: FileText,
      label: "Records",
      href: "/records",
      role: ["student"],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/settings",
      role: ["student", "lecturer", "admin"],
    },
  ];

  const filteredNavItems = role
    ? navItems.filter(item => item.role.includes(role))
    : [];
  const itemCount = filteredNavItems.length;

  if (!role || itemCount === 0) {
    return null;
  }

  return (
    <div className={`bg-background border-border fixed right-0 bottom-0 left-0 z-50 border-t ${role === "lecturer" ? "md:hidden" : ""}`}>
      <div className="safe-area-pb">
        {/* For 5 or fewer items, use flex justify-around */}
        {itemCount <= 5 ? (
          <div className="flex justify-around gap-2 px-2 py-1 sm:px-4 sm:py-2">
            {filteredNavItems.map(item => (
              <NavItem
                key={item.id}
                item={item}
                className="max-w-[80px] min-w-0 flex-1 px-1 sm:max-w-none sm:px-2"
              />
            ))}
          </div>
        ) : (
          /* For more than 5 items, use horizontal scroll */
          <div className="max-w-screen overflow-x-auto">
            <div className="flex justify-between gap-2 px-2 py-1 sm:px-4 sm:py-2">
              {filteredNavItems.map(item => (
                <NavItem key={item.id} item={item} className="px-3 sm:px-4" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
