import { renderHook } from "@testing-library/react";
import { useFullPath } from "@/hooks/useFullPath";
import { __setPathname, __setSearchParams } from "next/navigation";

describe("useFullPath", () => {
  test("builds full and encoded path", () => {
    __setPathname("/dashboard");
    __setSearchParams("a=1&b=hello world");
    const { result } = renderHook(() => useFullPath());
    expect(result.current.fullPath).toBe("/dashboard?a=1&b=hello+world");
    expect(result.current.encodedFullPath).toBe(encodeURIComponent("/dashboard?a=1&b=hello+world"));
  });
});
