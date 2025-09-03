import { auth } from "@/lib/server/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./_components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { returnTo: rawReturnTo } = await searchParams;
  const cookieStore = await cookies();
  const returnToCookie = cookieStore.get("returnTo")?.value;
  const mergedReturnTo = rawReturnTo ?? returnToCookie;
  const safeReturnTo =
    mergedReturnTo && mergedReturnTo.startsWith("/") && !mergedReturnTo.startsWith("//")
      ? mergedReturnTo
      : "/";

  if (session) {
    redirect(safeReturnTo);
  }

  return <LoginForm returnTo={safeReturnTo} />;
}
