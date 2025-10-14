"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/api/apiClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(8, "Minimum 8 characters"),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: "Password doesn't match",
    path: ["confirmPassword"],
  })
  .refine(d => d.newPassword !== d.currentPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

type Inputs = z.infer<typeof schema>;

export function ChangePasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<Inputs>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    resolver: zodResolver(schema),
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: Inputs) => {
    setLoading(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: true,
      });
      // Some better-auth client methods may return an object with error instead of throwing
      if (
        res &&
        typeof res === "object" &&
        "error" in res &&
        (res as Record<string, unknown>).error &&
        typeof (res as Record<string, unknown>).error === "object"
      ) {
        const errObj = (res as { error: { code?: string; message?: string } })
          .error;
        const code = (errObj.code || "").toUpperCase();
        const message = (errObj.message || "").toLowerCase();
        if (
          code === "INVALID_PASSWORD" ||
          (message.includes("current") && message.includes("password"))
        ) {
          toast.error("Current password is incorrect.");
        } else {
          toast.error("Failed to change password");
        }
        return; // stop; don't show success toast
      }
      toast.success("Password changed successfully");
      form.reset();
      onSuccess?.();
    } catch (_e) {
      let shown = false;
      if (typeof _e === "object" && _e) {
        const anyErr = _e as { code?: string; message?: string };
        const code = (anyErr.code || "").toUpperCase();
        const message = (anyErr.message || "").toLowerCase();
        if (
          code === "INVALID_PASSWORD" ||
          (message.includes("current") && message.includes("password"))
        ) {
          toast.error("Current password is incorrect.");
          shown = true;
        }
      }
      if (!shown) {
        toast.error("Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="********"
                    {...field}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="********"
                    {...field}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormDescription>Minimum 8 characters.</FormDescription>
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
                    type={showConfirm ? "text" : "password"}
                    placeholder="********"
                    {...field}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormDescription>Re-enter the new password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="h-10 min-w-32">
            {loading ? "Saving..." : "Update"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
