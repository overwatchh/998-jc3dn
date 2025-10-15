"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import apiClient, { authClient } from "@/lib/api/apiClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

const schema = z.object({
  email: z.string().email(),
});

type Inputs = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const form = useForm<Inputs>({
    defaultValues: { email: "" },
    resolver: zodResolver(schema),
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: Inputs) => {
    setLoading(true);
    try {
      // First, check if the email actually exists via our lightweight endpoint
      const { data } = await apiClient.post<{ exists: boolean }>(
        "/auth/email-exists",
        { email: values.email }
      );
      if (!data.exists) {
        toast.error("No account found for that email address.");
        return; // stop; don't call reset to avoid needless work
      }
      // Ask better-auth to send reset email and redirect to our reset page
      await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast.success("Password reset link sent. Check your email.");
      router.push("/login");
    } catch (_e) {
      // Improved error handling: surface unknown email while keeping other errors generic
      // Note: Revealing whether an email exists can enable user enumeration attacks.
      // This change was requested explicitly; reconsider if enumeration becomes a concern.
      let shown = false;
      if (typeof _e === "object" && _e) {
        // Some better-auth errors may include code/message properties
        const anyErr = _e as { code?: string; message?: string };
        const code = (anyErr.code || "").toUpperCase();
        const message = (anyErr.message || "").toLowerCase();
        if (
          code === "USER_NOT_FOUND" ||
          (message.includes("user") &&
            message.includes("not") &&
            message.includes("found"))
        ) {
          toast.error("No account found for that email address.");
          shown = true;
        }
      }
      if (!shown) {
        toast.error("Unable to process request. Please try again.");
      }
      // Do not redirect; allow user to correct input
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card overflow-hidden rounded-2xl border p-8 shadow-xl md:min-w-md">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we’ll send you a link to reset your password.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="h-11 w-full">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
