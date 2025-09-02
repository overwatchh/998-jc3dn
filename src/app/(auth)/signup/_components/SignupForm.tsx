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
import { useRegister } from "@/hooks/useAuth";
import { Roles } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";

const signupSchema = z
  .object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Password doesn't match",
    path: ["confirmPassword"],
  });

type SignupInputs = z.infer<typeof signupSchema>;

const defaultValues: SignupInputs = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignupForm() {
  const form = useForm<SignupInputs>({
    defaultValues: defaultValues,
    resolver: zodResolver(signupSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { mutateAsync: signup, isPending: isLoading, isError } = useRegister();
  const handleSignup: SubmitHandler<SignupInputs> = async data => {
    const { email, password, name } = data;
    await signup({ name, email, password, role: Roles.ADMIN });
    if (isError) {
      toast.error("Signup failed. Check your server log for more details.");
    }
    redirect("/");
  };

  return (
    <div className="bg-card overflow-hidden rounded-2xl border shadow-xl md:min-w-md">
      {/* Header */}
      <div className="bg-secondary text-primary px-8 pt-8 pb-6">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Create your account</h1>
          <p className="text-primary/80 text-sm">
            Join us and start your journey today
          </p>
        </div>
      </div>

      <Form {...form}>
        <div className="space-y-6 p-8">
          {/* Signup Form */}
          <form
            onSubmit={form.handleSubmit(handleSignup)}
            className="space-y-5"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your name will be used to log in.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your email address will be used to log in.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Password */}
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
                    <FormDescription>
                      Your password must be at least 8 characters long.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => {
                return (
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
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
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
                );
              }}
            />

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="border-input bg-background mt-1 h-4 w-4 rounded"
                required
              />
              <label
                htmlFor="terms"
                className="text-muted-foreground text-sm leading-5"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2"
              disabled={isLoading || !acceptTerms}
            >
              {isLoading ? (
                <div className="border-primary-foreground h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"></div>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="border-t pt-4 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </Form>
    </div>
  );
}
