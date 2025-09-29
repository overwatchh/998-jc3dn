"use client";

import { mockNotifications } from "@/app/(protected)/notifications/_components/mockdata";
import { INotification } from "@/app/(protected)/notifications/_components/mockdata";
import { useState } from "react";

export function useNotifications() {
  const [notifications, setNotifications] = useState<INotification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const addNotification = (notification: Omit<INotification, 'id'>) => {
    const newId = Math.max(...notifications.map(n => n.id), 0) + 1;
    setNotifications(prev => [{ ...notification, id: newId }, ...prev]);
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    addNotification,
  };
}
