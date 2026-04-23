import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Simple auth check - redirect to login if not authenticated
    // Except for public pages (auth pages + landing page)
    const publicPages = [
      "/", // Landing page
      "/auth/login", 
      "/auth/register", 
      "/auth/recovery", 
      "/auth/reset-password", 
      "/auth/confirm-email", 
      "/auth/verify-email", 
      "/404"
    ];
    
    const checkAuth = async () => {
      if (publicPages.includes(router.pathname)) {
        return; // Skip auth check for public pages
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace("/auth/login");
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router.pathname]);

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  );
}