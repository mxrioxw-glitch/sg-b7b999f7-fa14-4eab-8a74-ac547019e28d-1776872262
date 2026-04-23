import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { supabase } from "@/integrations/supabase/client";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // CRITICAL: Check Super Admin status on EVERY route change
    checkSuperAdmin();
  }, [router.pathname]);

  async function checkSuperAdmin() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setChecking(false);
        return;
      }

      // Check if Super Admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      // If Super Admin and NOT on super-admin page, redirect
      if (profile?.is_super_admin === true) {
        console.log("👑 [_APP] Super Admin detected");
        
        // FORCE redirect to super-admin if not already there
        if (router.pathname !== "/super-admin") {
          console.log("🚀 [_APP] Forcing redirect to /super-admin");
          await router.replace("/super-admin");
        }
      }

      setChecking(false);
    } catch (error) {
      console.error("[_APP] Error checking Super Admin:", error);
      setChecking(false);
    }
  }

  // Show nothing while checking to prevent flash of wrong content
  if (checking) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  );
}