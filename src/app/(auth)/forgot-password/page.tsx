import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }
  return <ForgotPasswordForm />;
}
