"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Bell, CheckCheck } from "lucide-react"
import { useState } from "react"
import { mockNotifications } from "./mockdata"
import { NotificationCard } from "./NotificationCard"

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState(mockNotifications)

  function markAllAsRead() {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })))
  }

  function filterNotifications(filter: string) {
    switch (filter) {
      case "unread":
        return notifications.filter(n => n.unread)
      case "attendance":
        return notifications.filter(
          n =>
            n.type === "warning" || n.title.toLowerCase().includes("attendance")
        )
      default:
        return notifications
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-primary/90">
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
          <CheckCheck className="h-4 w-4 mr-2" />
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

        <TabsContent value="all" className="space-y-3 mt-4">
          {filterNotifications("all").length > 0 ? (
            filterNotifications("all").map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3 mt-4">
          {filterNotifications("unread").length > 0 ? (
            filterNotifications("unread").map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No unread notifications</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-3 mt-4">
          {filterNotifications("attendance").length > 0 ? (
            filterNotifications("attendance").map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance alerts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
