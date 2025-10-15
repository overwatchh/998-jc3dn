import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }
  return <ResetPasswordForm />;
}
