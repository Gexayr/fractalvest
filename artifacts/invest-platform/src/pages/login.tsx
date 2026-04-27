import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const loginMutation = useLogin();
  const { login, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  if (!isLoading && user) {
    navigate("/dashboard");
    return null;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (response) => {
        login(response.token, response.user);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        navigate("/dashboard");
      },
      onError: (error) => {
        toast({ title: "Error", description: error.error?.error || "Failed to log in.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-primary mb-12">
        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-mono text-sm">FV</div>
        FractionalVest
      </Link>
      
      <div className="w-full max-w-md bg-card border border-border p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Access your portfolio</h1>
        <p className="text-muted-foreground mb-8">Enter your credentials to log in.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="investor@example.com" {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Log In"}
            </Button>
          </form>
        </Form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <GoogleAuthButton />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Create one</Link>
        </div>
      </div>
    </div>
  );
}