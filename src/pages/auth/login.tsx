import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff, Coffee, TrendingUp, BarChart3, Users, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

    if (formData.email === "mxrioxw@gmail.com") {
      console.log("🔍 Super Admin login detected");
    }

    try {
      const { user, error: loginError } = await authService.signIn(
        formData.email,
        formData.password
      );

      if (loginError || !user) {
        throw new Error(loginError?.message || "Error al iniciar sesión");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_super_admin === true) {
        toast({
          title: "👑 Super Admin",
          description: "Accediendo al panel de administración...",
          className: "bg-accent text-accent-foreground border-accent",
        });
        
        await router.replace("/super-admin");
        return;
      }

      const existingBusiness = await businessService.getCurrentBusiness();

      if (existingBusiness) {
        toast({
          title: "¡Bienvenido de nuevo!",
          description: `Hola, ${existingBusiness.name}`,
        });

        router.push("/pos");
        return;
      }

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
        description: "Tu negocio ha sido configurado exitosamente",
      });

      router.push("/pos");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Error al iniciar sesión");
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Verifica tus credenciales e intenta de nuevo",
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
        description="Sistema punto de venta en la nube - Gestiona tu negocio desde cualquier lugar"
      />
      
      <div className="min-h-screen flex bg-background">
        {/* Left Panel - Branding (Desktop only) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            {/* Logo & Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
                  <Coffee className="h-8 w-8 text-accent-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Nexum Cloud</h1>
                  <p className="text-white/80 text-sm">Sistema POS Profesional</p>
                </div>
              </div>
            </div>

            {/* Main Message */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold leading-tight">
                  Gestiona tu negocio con confianza
                </h2>
                <p className="text-xl text-white/90 leading-relaxed">
                  Sistema completo de punto de venta diseñado para cafeterías, restaurantes y negocios modernos.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <ShoppingCart className="h-8 w-8 mb-3 text-accent" />
                  <h3 className="font-semibold mb-1">Ventas Rápidas</h3>
                  <p className="text-sm text-white/80">Interfaz táctil optimizada</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <BarChart3 className="h-8 w-8 mb-3 text-accent" />
                  <h3 className="font-semibold mb-1">Reportes</h3>
                  <p className="text-sm text-white/80">Análisis en tiempo real</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <TrendingUp className="h-8 w-8 mb-3 text-accent" />
                  <h3 className="font-semibold mb-1">Inventario</h3>
                  <p className="text-sm text-white/80">Control automático</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <Users className="h-8 w-8 mb-3 text-accent" />
                  <h3 className="font-semibold mb-1">Clientes</h3>
                  <p className="text-sm text-white/80">Gestión completa</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-white/60">
              © {new Date().getFullYear()} Nexum Cloud. Sistema POS profesional en la nube.
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center space-y-2">
              <div className="inline-flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                  <Coffee className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Nexum Cloud</h1>
              </div>
              <p className="text-sm text-muted-foreground">Sistema POS Profesional</p>
            </div>

            {/* Login Card */}
            <Card className="border-2 shadow-xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-center text-base">
                  Ingresa tus credenciales para acceder
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={loading}
                      className="h-12 text-base"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-base font-medium">
                        Contraseña
                      </Label>
                      <Link
                        href="/auth/recovery"
                        className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
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
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={loading}
                        className="h-12 text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-destructive/10 border-2 border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Iniciando sesión...
                      </div>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-card text-muted-foreground">
                        ¿No tienes cuenta?
                      </span>
                    </div>
                  </div>

                  {/* Register Link */}
                  <div className="text-center">
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center justify-center gap-2 text-base font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      Crear cuenta gratis
                      <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Usado por negocios en todo el mundo
              </p>
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-accent"></div>
                  <span>Seguro</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-accent"></div>
                  <span>Confiable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-accent"></div>
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}