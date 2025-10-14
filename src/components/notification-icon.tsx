"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationIcon() {
  const { unreadCount } = useNotifications();

  return (
    <Button variant="outline" size="icon" asChild>
      <Link href="/notifications" aria-label="View notifications">
        <div className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge className="border-background absolute -top-1 -right-1 flex h-3 w-3 min-w-3 items-center justify-center rounded-full border-2 bg-red-500 p-0 text-[8px] hover:bg-red-500">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </div>
      </Link>
    </Button>
  );
}
