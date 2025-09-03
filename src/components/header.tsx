"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggler } from "./theme-toggler";
import { Button } from "./ui/button";

export const Header = () => {
  const { data: session, isPending } = useCurrentUser();

  function LoginButton() {
    if (isPending) {
      return (
        <Button>
          <Loader2 className="animate-spin" />
        </Button>
      );
    }

    if (!session?.user) {
      return (
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      );
    }

    return (
      <Link href={"/settings"} className="flex items-center gap-3">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name}
            width={20}
            height={20}
            className="rounded-full"
          />
        )}
        <span className="text-sm font-medium">{session.user.name}</span>
      </Link>
    );
  }

  return (
    <div className="border-primary/10 flex w-full justify-between border-b px-3 py-2">
      <Link href={"/"} className="text-2xl font-bold">
        Attendease
      </Link>

      <div className="flex items-center justify-end gap-3">
        <ThemeToggler />
        <LoginButton />
      </div>
    </div>
  );
};
