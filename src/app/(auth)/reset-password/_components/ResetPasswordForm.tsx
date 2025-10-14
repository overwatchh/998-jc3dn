"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/api/apiClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";
import { Eye, EyeOff } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password doesn't match",
    path: ["confirmPassword"],
  });

type Inputs = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = useMemo(() => params.get("token"), [params]);

  const form = useForm<Inputs>({
    defaultValues: { password: "", confirmPassword: "" },
    resolver: zodResolver(schema),
  });

  const [loading, setLoading] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      setInvalidLink(true);
    }
  }, [params]);

  const onSubmit = async (values: Inputs) => {
    if (!token) {
      toast.error("Reset link is invalid or expired.");
      setInvalidLink(true);
      return;
    }
    setLoading(true);
    try {
      await authClient.resetPassword({
        newPassword: values.password,
        token,
      });
      toast.success("Password has been reset. Please sign in.");
      router.push("/login");
    } catch (_e) {
      void _e; // acknowledge error to satisfy lint rules
      toast.error("Reset link is invalid or expired.");
      setInvalidLink(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card overflow-hidden rounded-2xl border p-8 shadow-xl md:min-w-md">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-muted-foreground text-sm">
          {invalidLink
            ? "This link is invalid or has expired. Please request a new one."
            : "Enter your new password below."}
        </p>
      </div>

      {!invalidLink && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your password must be at least 8 characters long.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>Confirm your password.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="h-11 w-full">
              {loading ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
