"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { ArrowRight, Eye, EyeOff, User } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod/v4";

const signinSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  rememberMe: z.boolean(),
});

type SigninInputs = z.infer<typeof signinSchema>;

const defaulValues: SigninInputs = {
  email: "",
  password: "",
  rememberMe: true,
};

export function LoginForm() {
  const form = useForm<SigninInputs>({
    defaultValues: defaulValues,
    resolver: zodResolver(signinSchema),
  });

  const [showPassword, setShowPassword] = useState(false);

  const {
    mutateAsync: login,
    isPending: isLoading,
    isError: _isError,
  } = useLogin();

  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/";

  const handleEmailLogin: SubmitHandler<SigninInputs> = async data => {
    try {
      await login({ ...data, callbackURL });
    } catch (err: unknown) {
      let message = "An unexpected error occurred.";
      if (err instanceof AxiosError) {
        message = err.response?.data?.message || message;
      }
      toast.error(message);
    }
  };

  const router = useRouter();

  const handleMicrosoftLogin = async () => {
    router.push(
      "/api/auth/microsoft?callbackURL=" + encodeURIComponent(callbackURL)
    );
  };

  return (
    <div className="bg-card overflow-hidden rounded-2xl border shadow-xl md:min-w-md">
      <div className="relative h-28 border-b">
        <Image
          className="object-cover"
          alt="University of Wollongong Australia"
          src={"/logo-secondary-mono.png"}
          fill
        />
      </div>
      {/* Form Content */}
      <div className="space-y-6 p-8">
        {/* Google Login */}
        <Button
          variant="outline"
          className="flex h-12 w-full items-center justify-center gap-3 bg-transparent"
          onClick={handleMicrosoftLogin}
          disabled={isLoading}
        >
          <User />
          <span className="font-medium">SSO Login</span>
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card text-muted-foreground px-4 font-medium">
              or sign in with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleEmailLogin)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormControl>
                        <label className="flex cursor-pointer items-center space-x-2">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-muted-foreground text-sm">
                            Remember me
                          </span>
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <a
                href="#"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="border-primary-foreground h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"></div>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <div className="border-t pt-4 text-center">
          <p className="text-muted-foreground text-sm">
            {"Don't have an account? "}
            <a
              href="/signup"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Create one now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
