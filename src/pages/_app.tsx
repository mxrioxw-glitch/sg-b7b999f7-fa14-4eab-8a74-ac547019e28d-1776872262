import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";

function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    async function loadCustomColors() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const business = await businessService.getCurrentBusiness();
        if (!business) return;

        // Apply custom colors if they exist
        if (business.primary_color && business.secondary_color && business.accent_color) {
          const root = document.documentElement;
          
          // Convert hex to HSL and apply
          root.style.setProperty("--primary", hexToHSL(business.primary_color));
          root.style.setProperty("--secondary", hexToHSL(business.secondary_color));
          root.style.setProperty("--accent", hexToHSL(business.accent_color));
          
          // Also update sidebar colors to match
          root.style.setProperty("--sidebar-primary", hexToHSL(business.primary_color));
          root.style.setProperty("--sidebar-ring", hexToHSL(business.accent_color));
        }
      } catch (error) {
        console.error("Error loading custom colors:", error);
      }
    }

    loadCustomColors();

    // Re-load colors when route changes or when returning to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadCustomColors();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}