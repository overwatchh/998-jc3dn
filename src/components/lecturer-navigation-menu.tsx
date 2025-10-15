"use client";

import Link from "next/link";
// No icon imports needed for current navigation items
import { Button } from "./ui/button";

interface NavItem {
  id: string;
  label: string;
  href: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    variant: "ghost",
  },
  {
    id: "attendance-tracking",
    label: "Attendance",
    href: "/attendance-tracking",
    variant: "ghost",
  },
];

export function LecturerNavigationMenu() {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {navItems.map(item => {
        return (
          <Button
            key={item.id}
            asChild
            variant={item.variant}
            size="sm"
            className="text-sm font-medium transition-colors"
          >
            <Link href={item.href}>
              <span>{item.label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
