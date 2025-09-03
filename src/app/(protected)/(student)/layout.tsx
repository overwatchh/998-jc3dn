import { auth } from "@/lib/server/auth";
import { Roles } from "@/types";
import { headers } from "next/headers";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // Server-side redirects disabled to prevent ngrok/mobile cookie race loops.
  // Client pages are responsible for redirecting unauthenticated users.
  return <div>{children}</div>;
};

export default Layout;
