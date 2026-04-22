import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    let isMounted = true;

    async function loadCustomColors() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // Si hay error o no hay usuario, usar colores por defecto y salir
        if (userError || !user) {
          console.log("No user found, using default colors");
          return;
        }

        if (!isMounted) return;

        // Get user's business_id from employees table
        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("business_id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Si hay error o no hay employee, usar colores por defecto
        if (employeeError) {
          console.error("Error getting employee:", employeeError);
          return;
        }

        if (!employee || !employee.business_id) {
          console.log("No business found for user, using default colors");
          return;
        }

        if (!isMounted) return;

        // Get business colors for THIS specific business
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("primary_color, secondary_color, accent_color")
          .eq("id", employee.business_id)
          .single();

        if (businessError) {
          console.error("Error getting business colors:", businessError);
          return;
        }

        if (!isMounted) return;

        // Apply custom colors if they exist for this business
        if (business?.primary_color && business?.secondary_color && business?.accent_color) {
          const root = document.documentElement;
          
          // Convert hex to HSL and apply
          root.style.setProperty("--primary", hexToHSL(business.primary_color));
          root.style.setProperty("--secondary", hexToHSL(business.secondary_color));
          root.style.setProperty("--accent", hexToHSL(business.accent_color));
          
          // Also update sidebar colors to match
          root.style.setProperty("--sidebar-primary", hexToHSL(business.primary_color));
          root.style.setProperty("--sidebar-ring", hexToHSL(business.accent_color));
          
          console.log("Custom colors applied for business:", employee.business_id);
        } else {
          console.log("No custom colors set for this business, using defaults");
        }
      } catch (error) {
        console.error("Error loading custom colors:", error);
        // En caso de error, continuar sin bloquear la app
      }
    }

    // Cargar colores al montar
    loadCustomColors();

    // Re-load colors when auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadCustomColors();
      }
      if (event === 'SIGNED_OUT') {
        // Restaurar colores por defecto al cerrar sesión
        const root = document.documentElement;
        root.style.setProperty("--primary", "16 23% 19%");
        root.style.setProperty("--secondary", "16 24% 35%");
        root.style.setProperty("--accent", "122 39% 49%");
        root.style.setProperty("--sidebar-primary", "16 23% 19%");
        root.style.setProperty("--sidebar-ring", "122 39% 49%");
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}