import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { Store, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

      // 2. CRITICAL: Check Super Admin FIRST - before any business logic
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      console.log("🔍 [LOGIN] Profile check:", { is_super_admin: profile?.is_super_admin });

      // If Super Admin, redirect immediately and STOP
      if (profile?.is_super_admin === true) {
        console.log("👑 [LOGIN] Super Admin detected - redirecting to /super-admin");
        toast({
          title: "👑 Super Admin Access",
          description: "Bienvenido al panel de administración",
          className: "bg-accent text-accent-foreground border-accent",
        });
        
        // Force immediate redirect
        await router.push("/super-admin");
        return; // STOP HERE - no business creation
      }

      console.log("👤 [LOGIN] Regular user - checking business...");

      // 3. Regular user flow - check business
      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      // 4. If NO business, create setup (first login)
      if (!existingBusiness) {
        console.log("🆕 [LOGIN] First login - creating business setup");

        const fullName = user.user_metadata?.full_name || formData.email.split("@")[0];
        const businessName = user.user_metadata?.business_name || `Negocio de ${fullName}`;

        // Create business
        const { business: businessData, error: businessError } = await businessService.createBusiness({
          name: businessName,
          email: formData.email,
        });

        if (businessError || !businessData) {
          console.error("❌ [LOGIN] Error creating business:", businessError);
          throw new Error("Error al configurar el negocio");
        }

        console.log("✅ [LOGIN] Business created:", businessData.id);

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
          console.error("❌ [LOGIN] Error creating employee:", employeeError);
          throw new Error("Error al crear el empleado");
        }

        console.log("✅ [LOGIN] Employee created");

        // Create trial subscription
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

      // 5. Redirect to POS
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
    <>
      <SEO 
        title="Iniciar Sesión - Nexum Cloud"
        description="Inicia sesión en tu cuenta de Nexum Cloud"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Store className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-3xl font-bold">Nexum Cloud</h1>
            </div>
            <p className="text-muted-foreground">
              Inicia sesión en tu cuenta
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para continuar
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link 
                      href="/auth/recovery" 
                      className="text-sm text-accent hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                <p className="text-sm text-center text-muted">
                  ¿No tienes cuenta?{" "}
                  <Link 
                    href="/auth/register" 
                    className="text-accent hover:underline font-medium"
                  >
                    Regístrate gratis
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}