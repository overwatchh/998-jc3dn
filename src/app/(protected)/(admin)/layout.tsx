import { auth } from "@/lib/auth/auth"
import { Roles } from "@/lib/auth/permission"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }
  if (session.user.role !== Roles.ADMIN) {
    redirect("/dashboard")
  }
  return <div>{children}</div>
}

export default Layout
