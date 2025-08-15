"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/auth-client"
import type { Role } from "@/lib/auth/permission"
import { Bell, FileText, Home, QrCode, Settings, UserCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  id: string
  icon: React.FC<React.SVGProps<SVGSVGElement>>
  label: string
  shortLabel?: string // For very small screens
  href: string
  role: Role[]
}

interface NavItemProps {
  item: NavItem
  isActive: boolean
  className?: string
}

function NavItem({ item, isActive, className = "" }: NavItemProps) {
  const Icon = item.icon

  return (
    <Button
      asChild
      key={item.id}
      variant="ghost"
      size="sm"
      className={`relative flex flex-col items-center justify-center space-y-0.5 h-auto py-2 hover:bg-accent/50 ${
        isActive
          ? "text-primary bg-accent/50"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      <Link
        href={item.href}
        className="flex flex-col items-center justify-center space-y-0.5 grow"
      >
        <div className="relative">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          {isActive && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
          )}
        </div>
        <span className="text-[10px] sm:text-xs font-medium leading-tight text-center truncate w-full">
          <span className="hidden xs:inline">{item.label}</span>
          <span className="xs:hidden">{item.shortLabel || item.label}</span>
        </span>
      </Link>
    </Button>
  )
}

export function BottomNavigation() {
  const { data: session } = authClient.useSession()
  const pathname = usePathname()
  const role = session?.user.role as Role

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
      id: "report",
      icon: FileText,
      label: "Report",
      href: "/report",
      role: ["lecturer"],
    },
    {
      id: "scan",
      icon: QrCode,
      label: "Scan",
      href: "/scan",
      role: ["student"],
    },
    {
      id: "records",
      icon: FileText,
      label: "Records",
      href: "/records",
      role: ["student"],
    },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      shortLabel: "Notifications",
      href: "/notifications",
      role: ["student", "lecturer", "admin"],
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/settings",
      role: ["student", "lecturer", "admin"],
    },
  ]

  const filteredNavItems = navItems.filter(item => item.role.includes(role))
  const itemCount = filteredNavItems.length

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="safe-area-pb">
        {/* For 5 or fewer items, use flex justify-around */}
        {itemCount <= 5 ? (
          <div className="flex justify-around gap-2 px-2 py-1 sm:px-4 sm:py-2">
            {filteredNavItems.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isActive={pathname === item.href}
                className="px-1 sm:px-2 min-w-0 flex-1 max-w-[80px] sm:max-w-none"
              />
            ))}
          </div>
        ) : (
          /* For more than 5 items, use horizontal scroll */
          <div className="overflow-x-auto max-w-screen">
            <div className="flex px-2 py-1 sm:px-4 gap-2 justify-between sm:py-2">
              {filteredNavItems.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={pathname === item.href}
                  className="px-3 sm:px-4"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
