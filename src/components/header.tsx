"use client"

import { authClient } from "@/lib/auth/auth-client"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggler } from "./theme-toggler"
import { Button } from "./ui/button"

export const Header = () => {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return null
  }

  return (
    <div className="w-full px-3 py-2 flex justify-between border-b border-primary/10">
      <Link href={"/"} className="text-2xl font-bold">
        Attendease
      </Link>

      <div className="flex items-center justify-end gap-3">
        <ThemeToggler />

        {!session ? (
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        ) : (
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
        )}
      </div>
    </div>
  )
}
