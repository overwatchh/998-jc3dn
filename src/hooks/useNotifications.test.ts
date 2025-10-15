import { renderHook, act } from "@testing-library/react";
import { useNotifications } from "@/hooks/useNotifications";

// Mock initial data
jest.mock("@/app/(protected)/notifications/_components/mockdata", () => ({
  mockNotifications: [
    { id: 1, title: "A", description: "", type: "info", date: "", unread: true },
    { id: 2, title: "B", description: "", type: "warning", date: "", unread: false },
  ],
}));

describe("useNotifications", () => {
  test("initial unreadCount computed", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.unreadCount).toBe(1);
  });

  test("markAllAsRead clears unread", () => {
    const { result } = renderHook(() => useNotifications());
    act(() => result.current.markAllAsRead());
    expect(result.current.unreadCount).toBe(0);
  });

  test("markAsRead marks a specific one", () => {
    const { result } = renderHook(() => useNotifications());
    act(() => result.current.markAsRead(1));
    expect(result.current.unreadCount).toBe(0);
  });

  test("addNotification prepends with auto-increment id", () => {
    const { result } = renderHook(() => useNotifications());
    const prevLen = result.current.notifications.length;
    act(() => result.current.addNotification({ title: "C", description: "", type: "info", date: "", unread: true } as any));
    expect(result.current.notifications.length).toBe(prevLen + 1);
    expect(result.current.notifications[0].id).toBeGreaterThan(2);
  });
});

