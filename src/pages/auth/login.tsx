import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [debugMsg, setDebugMsg] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDebugMsg("Iniciando sesión...");
    setLoading(true);

    try {
      // 1. Login
      const { user, error: loginError } = await authService.signIn(
        formData.email,
        formData.password
      );

      if (loginError || !user) {
        throw new Error(loginError?.message || "Error al iniciar sesión");
      }

      setDebugMsg("Usuario autenticado");

      // 2. CRITICAL: Check Super Admin FIRST
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      // Super Admin bypass - redirect immediately
      if (profile?.is_super_admin === true) {
        setDebugMsg("👑 SUPER ADMIN - Redirigiendo...");
        
        toast({
          title: "👑 Super Admin",
          description: "Bienvenido al panel de administración",
        });

        await router.replace("/super-admin");
        return;
      }

      setDebugMsg("Usuario regular - verificando negocio...");

      // 3. Check if user has a business
      const { data: employee } = await supabase
        .from("employees")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employee) {
        // User already has business
        setDebugMsg("Negocio encontrado - redirigiendo...");
        toast({
          title: "¡Bienvenido de nuevo!",
          description: "Redirigiendo al sistema...",
        });
        await router.push("/pos");
        return;
      }

      setDebugMsg("Creando negocio nuevo...");

      // 4. Create new business
      const businessData = {
        name: `Negocio de ${user.email.split("@")[0]}`,
        owner_id: user.id,
      };

      const result = await businessService.createBusiness(businessData);

      if (result.error || !result.business) {
        throw new Error(result.error || "Error al crear el negocio");
      }

      const newBusiness = result.business;

      setDebugMsg("Negocio creado - configurando trial...");

      // 5. Create 7-day trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const { data: basicPlan } = await supabase
        .from("subscription_plans")
        .select("id")
        .ilike("name", "Básico")
        .maybeSingle();

      if (basicPlan) {
        await supabase.from("subscriptions").insert({
          business_id: newBusiness.id,
          plan_id: basicPlan.id,
          status: "trialing",
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnd.toISOString(),
          trial_end: trialEnd.toISOString(),
        });
      }

      setDebugMsg("Trial activado - redirigiendo...");

      toast({
        title: "¡Cuenta creada!",
        description: "7 días gratis activados",
      });

      await router.push("/pos");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Error al iniciar sesión");
      setDebugMsg("");
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Iniciar Sesión - Nexum Cloud"
        description="Accede a tu sistema POS en la nube"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Nexum Cloud</h1>
            <p className="text-muted-foreground">
              Inicia sesión para continuar
            </p>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg border border-destructive/20">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/auth/recovery"
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-foreground/60">¿No tienes cuenta? </span>
                  <Link
                    href="/auth/register"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </div>

                {loading && debugMsg && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm text-center text-muted-foreground">
                      {debugMsg}
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Al continuar, aceptas nuestros términos de servicio
            </p>
          </div>
        </div>
      </div>
    </>
  );
}