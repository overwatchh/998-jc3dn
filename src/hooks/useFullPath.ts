import { usePathname, useSearchParams } from "next/navigation";

interface ReturnType {
  fullPath: string;
  encodedFullPath: string;
}

export function useFullPath(): ReturnType {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = pathname + "?" + searchParams.toString();
  const encodedFullPath = encodeURIComponent(fullPath);
  return { fullPath, encodedFullPath };
}
