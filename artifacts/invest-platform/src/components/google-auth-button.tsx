import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface CredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: { theme?: string; size?: string; width?: number; text?: string },
          ) => void;
        };
      };
    };
  }
}

export function GoogleAuthButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    const initButton = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });

            const data = await res.json();

            if (!res.ok) {
              toast({
                title: "Sign-in failed",
                description: data.error || "Google sign-in failed",
                variant: "destructive",
              });
              return;
            }

            login(data.token, data.user);
            toast({ title: "Welcome", description: "Signed in with Google." });
            navigate("/dashboard");
          } catch {
            toast({
              title: "Sign-in failed",
              description: "Google sign-in failed. Please try again.",
              variant: "destructive",
            });
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: buttonRef.current.offsetWidth || 400,
        text: "signin_with",
      });
    };

    if (window.google) {
      initButton();
      return;
    }

    const scriptId = "google-gsi-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", initButton);
    return () => script?.removeEventListener("load", initButton);
  }, [clientId, login, toast, navigate]);

  if (!clientId) return null;

  return <div ref={buttonRef} className="w-full min-h-[44px]" />;
}
