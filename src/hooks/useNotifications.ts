"use client";

import {
  INotification,
  mockLecturerNotifications,
  mockStudentNotifications,
} from "@/app/(protected)/notifications/_components/mockdata";
import { useState } from "react";
import { useCurrentUser } from "./useAuth";

export function useNotifications() {
  const { data } = useCurrentUser();
  const role = data?.user?.role;

  // Choose role-specific seed list (lecturer vs student). Admin currently reuses lecturer list.
  const seed: INotification[] =
    role === "lecturer" || role === "admin"
      ? mockLecturerNotifications
      : mockStudentNotifications;

  const [notifications, setNotifications] = useState<INotification[]>(seed);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, unread: false } : notif))
    );
  };

  const addNotification = (notification: Omit<INotification, "id">) => {
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
