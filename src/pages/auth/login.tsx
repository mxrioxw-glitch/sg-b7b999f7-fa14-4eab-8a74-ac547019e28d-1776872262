import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
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

    try {
      console.log("🔐 [LOGIN] Starting login process...");
      
      // 1. Login
      const { user, error: loginError } = await authService.signIn(
        formData.email,
        formData.password
      );

      if (loginError || !user) {
        throw new Error(loginError?.message || "Error al iniciar sesión");
      }

      console.log("✅ [LOGIN] User authenticated:", user.id);

      // 2. CRITICAL: Check Super Admin FIRST
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      console.log("🔍 [LOGIN] Profile check:", { is_super_admin: profile?.is_super_admin });

      // ⚡ SUPER ADMIN PATH - NO business, NO subscription, JUST redirect
      if (profile?.is_super_admin === true) {
        console.log("👑 [LOGIN] SUPER ADMIN DETECTED - Skipping all business logic");
        console.log("🚀 [LOGIN] Redirecting directly to /super-admin");
        
        setLoading(false); // Stop loading immediately
        
        toast({
          title: "👑 Super Admin Access",
          description: "Bienvenido al panel de administración",
          className: "bg-accent text-accent-foreground border-accent",
        });
        
        // Immediate redirect and STOP execution
        router.push("/super-admin");
        return; // CRITICAL: Exit function completely
      }

      // 3. REGULAR USER PATH - only execute if NOT super admin
      console.log("👤 [LOGIN] Regular user - proceeding with business logic...");

      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!existingBusiness) {
        console.log("🆕 [LOGIN] First login - creating business setup");

        const fullName = user.user_metadata?.full_name || formData.email.split("@")[0];
        const businessName = user.user_metadata?.business_name || `Negocio de ${fullName}`;

        const { business: businessData, error: businessError } = await businessService.createBusiness({
          name: businessName,
          email: formData.email,
        });

        if (businessError || !businessData) {
          console.error("❌ [LOGIN] Error creating business:", businessError);
          throw new Error("Error al configurar el negocio");
        }

        console.log("✅ [LOGIN] Business created:", businessData.id);

        const { error: employeeError } = await supabase
          .from("employees")
          .insert({
            business_id: businessData.id,
            user_id: user.id,
            role: "owner",
            is_active: true,
          });

        if (employeeError) {
          console.error("❌ [LOGIN] Error creating employee:", employeeError);
          throw new Error("Error al crear el empleado");
        }

        console.log("✅ [LOGIN] Employee created");

        const { error: subscriptionError } = await subscriptionService.createTrialSubscription(businessData.id);

        if (subscriptionError) {
          console.error("❌ [LOGIN] Error creating subscription:", subscriptionError);
          throw new Error("Error al crear la suscripción");
        }

        console.log("✅ [LOGIN] Trial subscription created");

        toast({
          title: "✅ Bienvenido a Nexum Cloud",
          description: "Tu cuenta está lista - 7 días de prueba gratis",
          className: "bg-accent text-accent-foreground border-accent",
        });
      } else {
        console.log("✅ [LOGIN] Existing business found - welcome back");
        toast({
          title: "✅ Sesión iniciada",
          description: "Bienvenido de nuevo",
          className: "bg-accent text-accent-foreground border-accent",
        });
      }

      console.log("🔄 [LOGIN] Redirecting to /pos");
      router.push("/pos");

    } catch (err: any) {
      console.error("💥 [LOGIN] Login error:", err);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}