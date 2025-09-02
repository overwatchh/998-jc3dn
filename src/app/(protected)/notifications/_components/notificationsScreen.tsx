"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { NotificationCard } from "./NotificationCard";
import { mockNotifications } from "./mockdata";

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState(mockNotifications);

  function markAllAsRead() {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
  }

  function filterNotifications(filter: string) {
    switch (filter) {
      case "unread":
        return notifications.filter(n => n.unread);
      case "attendance":
        return notifications.filter(
          n =>
            n.type === "warning" || n.title.toLowerCase().includes("attendance")
        );
      default:
        return notifications;
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-primary/90 text-xl font-semibold">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-100">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {/* Notification Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {filterNotifications("all").length > 0 ? (
            filterNotifications("all").map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No notifications</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 space-y-3">
          {filterNotifications("unread").length > 0 ? (
            filterNotifications("unread").map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <CheckCheck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No unread notifications</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-3">
          {filterNotifications("attendance").length > 0 ? (
            filterNotifications("attendance").map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">No attendance alerts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
