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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

      // 2. Check if Super Admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      // If Super Admin, redirect to super-admin panel
      if (profile?.is_super_admin === true) {
        toast({
          title: "👑 Super Admin",
          description: "Bienvenido al panel de administración",
        });
        
        await router.replace("/super-admin");
        return;
      }

      // 3. Regular user - check if has business
      const { data: employee } = await supabase
        .from("employees")
        .select("business_id, businesses(name)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employee?.business_id) {
        // Existing user - go to POS
        toast({
          title: "Bienvenido de nuevo",
          description: `Accediendo a ${employee.businesses?.name || "tu negocio"}...`,
        });
        
        await router.replace("/pos");
        return;
      }

      // 4. New user - create business
      const businessData = {
        name: `Negocio de ${user.email.split("@")[0]}`,
        owner_id: user.id,
      };

      const result = await businessService.createBusiness(businessData);

      if (result.error || !result.business) {
        throw new Error(result.error || "Error al crear el negocio");
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Tu negocio está listo. Bienvenido a Nexum Cloud.",
      });

      await router.replace("/pos");

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Error al iniciar sesión");
      toast({
        title: "Error",
        description: err.message || "Error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Iniciar Sesión - Nexum Cloud POS"
        description="Accede a tu sistema POS en la nube"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Branding */}
          <div className="hidden lg:block space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Nexum Cloud</h1>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              El sistema punto de venta completo para tu negocio. Gestiona ventas, inventario, clientes y reportes desde cualquier lugar.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-foreground text-xs">✓</span>
                </div>
                <p className="text-muted-foreground">Sistema en la nube - accede desde cualquier dispositivo</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-foreground text-xs">✓</span>
                </div>
                <p className="text-muted-foreground">Gestión completa de inventario y productos</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent-foreground text-xs">✓</span>
                </div>
                <p className="text-muted-foreground">Reportes y análisis en tiempo real</p>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/auth/recovery"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
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
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}