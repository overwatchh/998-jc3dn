"use client";

import { LoadingScreen } from "@/components/loading-skeleton";
import { useCurrentUser } from "@/hooks/useAuth";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <LoadingScreen />;

  if (!user) redirect("/login");

  redirect("/dashboard");
}
