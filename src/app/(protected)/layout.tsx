"use client";

import { BottomNavigation } from "@/components/bottom-navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { useFullPath } from "@/hooks/useFullPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { encodedFullPath: callbackURL } = useFullPath();

  const { data: session, isPending } = useCurrentUser();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(`/login?callbackURL=${callbackURL}`);
    }
  }, [session, router, callbackURL, isPending]);

  const role = session?.user?.role;

  return (
    <div className="flex grow flex-col pb-20">
      {children}
      {role && <BottomNavigation role={role} />}
    </div>
  );
}
