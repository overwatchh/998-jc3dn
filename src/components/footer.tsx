"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { Roles } from "@/types";
import Link from "next/link";

// A cleaner, minimalist footer replacing the previous heavy layout.
// Hidden for students (role === student) per requirement.
export function Footer() {
  const { data } = useCurrentUser();
  if (data?.user?.role === Roles.STUDENT) return null;
  const year = new Date().getFullYear();
  const links: { href: string; label: string }[] = [
    { href: "/privacy", label: "Privacy" },
    { href: "/support", label: "Support" },
    { href: "/swagger", label: "API Docs" },
  ];

  return (
    <footer className="from-background to-muted/30 supports-[backdrop-filter]:bg-background/80 mt-16 border-t bg-gradient-to-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/90 text-primary-foreground ring-primary/30 flex h-9 w-9 items-center justify-center rounded-md shadow-sm ring-1">
              <span className="text-sm font-semibold tracking-wide">QR</span>
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-bold">Attendease</span>
              <span className="text-muted-foreground text-xs">
                Smart attendance infrastructure
              </span>
            </div>
          </div>

          <nav
            aria-label="Footer Navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
          >
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col-reverse items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center">
          <p className="text-muted-foreground text-xs">
            © {year} Attendease. All rights reserved.
          </p>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-mono tracking-tight">
              v0.1.0
            </span>
            <span className="hidden md:inline" aria-hidden>
              •
            </span>
            <span className="max-w-[38ch] leading-relaxed sm:max-w-none">
              Built for reliability, privacy, and real-time insight.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
