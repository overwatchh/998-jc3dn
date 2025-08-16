import { auth } from "@/lib/server/auth";
import { Roles } from "@/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== Roles.STUDENT) {
    redirect("/dashboard");
  }
  return <div>{children}</div>;
};

export default Layout;
