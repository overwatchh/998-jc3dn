import axiosModule, { __getLastCreateConfig as getAxiosConfig } from "axios";
import { __getLastCreateConfig as getAuthConfig } from "better-auth/client";

describe("apiClient", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("axios instance configured with baseURL and withCredentials", async () => {
    const module = await import("@/lib/api/apiClient");
    const apiClient: any = module.default;

    const axiosMock = await import("axios");
    const cfg = (axiosMock as any).__getLastCreateConfig?.();
    expect(cfg?.baseURL).toBe("/api");
    expect(cfg?.withCredentials).toBe(true);
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });

  test("better-auth client created with proper baseURL in dev", async () => {
    process.env.NODE_ENV = "development";
    await import("@/lib/api/apiClient");
    const authMock = await import("better-auth/client");
    const cfg = (authMock as any).__getLastCreateConfig?.();
    expect(cfg?.baseURL).toBe("http://localhost:3000");
  });
});
