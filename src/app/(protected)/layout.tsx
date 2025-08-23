import { BottomNavigation } from "@/components/bottom-navigation";
import { auth } from "@/lib/server/auth";
import { Role } from "@/types";
import { headers } from "next/headers";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const role = session?.user.role as Role;

  return (
    <div className="flex flex-col grow pb-20">
      {children}
      {role && <BottomNavigation role={role} />}
    </div>
  );
}
