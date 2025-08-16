"use client";

import { LoadingScreen } from "@/components/loading-skeleton";
import { useCurrentUser } from "@/hooks/useAuth";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: user, isPending, isError } = useCurrentUser();

  if (isPending) return <LoadingScreen />;
  if (isError) throw new Error("Error fetching user data");

  if (!user) redirect("/login");

  redirect("/dashboard");
}
