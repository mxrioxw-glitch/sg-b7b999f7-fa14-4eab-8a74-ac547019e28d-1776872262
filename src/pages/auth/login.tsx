import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("═══════════════════════════════════════════════");
    console.log("🔐 LOGIN VERSION: 2026-04-23 08:10 UTC");
    console.log("═══════════════════════════════════════════════");

    try {
      console.log("🔐 Attempting login for:", formData.email);
      
      // 1. AUTHENTICATE USER
      const { user, error: loginError } = await authService.signIn(
        formData.email,
        formData.password
      );

      if (loginError || !user) {
        throw new Error(loginError?.message || "Error al iniciar sesión");
      }

      console.log("✅ User authenticated:", user.id);

      // 2. CHECK IF SUPER ADMIN - THIS IS THE ONLY THING THAT MATTERS
      console.log("🔍 Checking Super Admin status...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      console.log("👤 Profile:", profile);
      console.log("👤 is_super_admin:", profile?.is_super_admin);

      // 3. IF SUPER ADMIN → GO TO /super-admin AND STOP
      if (profile?.is_super_admin === true) {
        console.log("👑👑👑 SUPER ADMIN DETECTED 👑👑👑");
        console.log("🚀 Redirecting to /super-admin");
        
        toast({
          title: "👑 Super Admin",
          description: "Bienvenido al panel de administración",
          className: "bg-accent text-accent-foreground",
        });

        setLoading(false);
        await router.push("/super-admin");
        console.log("✅ Redirect complete");
        return; // STOP - DO NOT CONTINUE
      }

      console.log("👤 Regular user - checking/creating business...");

      // 4. REGULAR USER - Check if business exists
      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      // 5. IF NO BUSINESS → FIRST TIME LOGIN - CREATE SETUP
      if (!existingBusiness) {
        console.log("🆕 First login - creating business setup");

        const fullName = user.user_metadata?.full_name || formData.email.split("@")[0];
        const businessName = user.user_metadata?.business_name || `Negocio de ${fullName}`;

        // Create business
        const { business: businessData, error: businessError } = await businessService.createBusiness({
          name: businessName,
          email: formData.email,
        });

        if (businessError || !businessData) {
          console.error("❌ Error creating business:", businessError);
          throw new Error("Error al configurar el negocio");
        }

        console.log("✅ Business created:", businessData.id);

        // Create employee owner
        const { error: employeeError } = await supabase
          .from("employees")
          .insert({
            business_id: businessData.id,
            user_id: user.id,
            role: "owner",
            is_active: true,
          });

        if (employeeError) {
          console.error("❌ Error creating employee:", employeeError);
          throw new Error("Error al crear el empleado");
        }

        console.log("✅ Employee created");

        // Create 7-day trial subscription
        const { data: basicPlan } = await supabase
          .from("subscription_plans")
          .select("id")
          .ilike("name", "Básico")
          .maybeSingle();

        if (!basicPlan) {
          console.error("❌ Básico plan not found");
          throw new Error("Plan Básico no encontrado");
        }

        const now = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7); // 7 days trial

        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .insert({
            business_id: businessData.id,
            plan_id: basicPlan.id,
            status: "trialing",
            current_period_start: now.toISOString(),
            current_period_end: trialEnd.toISOString(),
            trial_end: trialEnd.toISOString(),
          });

        if (subscriptionError) {
          console.error("❌ Error creating subscription:", subscriptionError);
          throw new Error("Error al crear la suscripción");
        }

        console.log("✅ Trial subscription created (7 days)");

        toast({
          title: "✅ Bienvenido a Nexum Cloud",
          description: "Tu cuenta está lista - 7 días de prueba gratis",
          className: "bg-accent text-accent-foreground",
        });
      } else {
        console.log("✅ Existing business found - welcome back");
        toast({
          title: "✅ Sesión iniciada",
          description: "Bienvenido de nuevo",
          className: "bg-accent text-accent-foreground",
        });
      }

      // 6. REDIRECT TO POS
      console.log("🔄 Redirecting to /pos");
      router.push("/pos");

    } catch (err: any) {
      console.error("💥 Login error:", err);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Iniciar Sesión - Nexum Cloud POS"
        description="Accede a tu sistema punto de venta en la nube"
      />
      <div className="min-h-screen flex">
        {/* Left side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                Nexum Cloud
              </h1>
              <p className="text-muted-foreground">
                Sistema POS en la Nube
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Iniciar Sesión
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-12"
                  />
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/auth/recovery"
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:underline font-medium"
                  >
                    Regístrate gratis
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Hero */}
        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
          <div className="max-w-lg text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-accent-foreground text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              Sistema POS en la Nube
            </div>

            <h2 className="text-5xl font-bold text-primary-foreground">
              Nexum Cloud
            </h2>

            <p className="text-xl text-primary-foreground/90">
              El sistema punto de venta completo para tu negocio. Gestiona ventas, inventario, clientes y reportes desde cualquier lugar.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-accent">7 días</div>
                <div className="text-primary-foreground/80">Prueba gratis</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <div className="text-primary-foreground/80">Soporte</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}