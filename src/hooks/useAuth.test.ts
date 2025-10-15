import { renderHook, act } from "@testing-library/react";
import * as apiModule from "@/lib/api/apiClient";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/lib/queryClient", () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

jest.mock("@/lib/api/apiClient", () => {
  const axios = require("axios");
  const { createAuthClient } = require("better-auth/client");
  const api = axios.create({});
  const auth = createAuthClient({});
  return { default: api, authClient: auth };
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: (opt: any) => ({ data: undefined, isPending: false, error: undefined, ...opt }),
  useMutation: (opt: any) => ({
    isPending: false,
    mutateAsync: async (...args: any[]) => {
      const res = await opt.mutationFn(...args);
      if (typeof opt.onSuccess === "function") opt.onSuccess(res);
      return res;
    },
  }),
}));

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("useCurrentUser queries /auth/me", async () => {
    const hooks = await import("@/hooks/useAuth");
    const api = (apiModule as any).default;
    api.get = jest.fn().mockResolvedValue({ data: { user: { id: "1" } } });

    const { result } = renderHook(() => hooks.useCurrentUser());
    const data = await result.current.queryFn();
    expect(api.get).toHaveBeenCalledWith("/auth/me");
    expect(data).toEqual({ user: { id: "1" } });
  });

  test("useLogin mutation posts and redirects on success", async () => {
    const hooks = await import("@/hooks/useAuth");
    const api = (apiModule as any).default;
    api.post = jest.fn().mockResolvedValue({ data: { redirect: true, url: "/dashboard" } });

    const { result } = renderHook(() => hooks.useLogin());
    await act(async () => {
      await result.current.mutateAsync({ email: "a", password: "b", rememberMe: false, callbackURL: "" });
    });

    expect(api.post).toHaveBeenCalledWith("/auth/signin", expect.any(Object));
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  test("useRegister posts", async () => {
    const hooks = await import("@/hooks/useAuth");
    const api = (apiModule as any).default;
    api.post = jest.fn().mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => hooks.useRegister());
    const res = await result.current.mutateAsync({ name: "n", email: "e", password: "p" });
    expect(api.post).toHaveBeenCalledWith("/auth/signup", { name: "n", email: "e", password: "p" });
    expect(res).toEqual({ ok: true });
  });

  test("useLogout calls authClient.signOut and redirects", async () => {
    const hooks = await import("@/hooks/useAuth");
    const { authClient } = require("@/lib/api/apiClient");
    authClient.signOut = jest.fn().mockResolvedValue({});

    const { result } = renderHook(() => hooks.useLogout());
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(authClient.signOut).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
