"use client";

import { BottomNavigation } from "@/components/bottom-navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const callbackUrl = encodeURIComponent(pathname);

  useEffect(() => {
    if (!data?.user) {
      router.push(`/login?callbackURL=${callbackUrl}`);
    }
  }, [callbackUrl, data, router]);

  const role = data?.user?.role;

  return (
    <div className="flex grow flex-col pb-20">
      {children}
      {role && <BottomNavigation role={role} />}
    </div>
  );
}
