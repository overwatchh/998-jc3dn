"use client";

import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import {
  Info,
  Loader2,
  QrCode,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  HelpCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NotificationIcon } from "./notification-icon";
import { ThemeToggler } from "./theme-toggler";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Roles } from "@/types";
import { LecturerNavigationMenu } from "./lecturer-navigation-menu";

export const Header = () => {
  const { data: session, isPending } = useCurrentUser();
  const logout = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  async function handleLogout() {
    await logout.mutateAsync();
  }

  function LoginButton() {
    if (isPending) {
      return (
        <Button>
          <Loader2 className="animate-spin" />
        </Button>
      );
    }

    if (!session?.user) {
      return (
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      );
    }

    // Show dropdown menu for lecturers only
    if (session.user.role === Roles.LECTURER) {
      return (
        <div
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 hover:bg-transparent group">
                <div className="relative">
                  <Image
                    src={session.user.image || "/placeholder.svg"}
                    alt={session.user.name}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-primary/20 ring-1 ring-primary/5 group-hover:border-primary/30 group-hover:ring-primary/10 transition-all duration-200 shadow-sm"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors duration-200">{session.user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User Info Header */}
              <div className="p-4 border-b border-border bg-background">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <Image
                      src={session.user.image || "/placeholder.svg"}
                      alt={session.user.name}
                      width={32}
                      height={32}
                      className="rounded-full border border-primary/20 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/attendance-tracking" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Attendance Tracking</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/qr-generation" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span>QR Generation</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>{logout.isPending ? "Signing Out..." : "Sign Out"}</span>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    // For students and other roles, show simple link to settings
    return (
      <Link href={"/settings"} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors group">
        <div className="relative">
          <Image
            src={session.user.image || "/placeholder.svg"}
            alt={session.user.name}
            width={32}
            height={32}
            className="rounded-full border-2 border-primary/20 ring-1 ring-primary/5 group-hover:border-primary/30 group-hover:ring-primary/10 transition-all duration-200 shadow-sm"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
        <span className="text-sm font-medium group-hover:text-primary transition-colors duration-200">{session.user.name}</span>
      </Link>
    );
  }

  return (
    <TooltipProvider>
      <div className="border-primary/10 flex w-full justify-between border-b px-3 py-2">
        <div className="flex items-center gap-6">
          <Link href={"/"} className="text-2xl font-bold">
            Attendease
          </Link>

          {/* Desktop navigation for lecturers */}
          {session?.user?.role === Roles.LECTURER && <LecturerNavigationMenu />}
        </div>

        <div className="flex items-center justify-end gap-3">
          {/* Separate QR Code button for lecturers */}
          {session?.user?.role === Roles.LECTURER && (
            <div className="hidden md:flex">
              <Link href="/qr-generation">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  <span className="font-medium">Generate QR Code</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Support Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" asChild>
                <Link href="/support" className="flex items-center gap-2" aria-label="View support and help">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Support</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Support & Help</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <Link href="/tutorial" aria-label="View FAQ and tutorial">
                  <Info className="h-[1.2rem] w-[1.2rem]" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>FAQ & Tutorial</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggler />
          {session?.user && <NotificationIcon />}
          <LoginButton />
        </div>
      </div>
    </TooltipProvider>
  );
};
