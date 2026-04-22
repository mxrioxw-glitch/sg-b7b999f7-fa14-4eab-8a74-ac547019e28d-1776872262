import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff, Coffee, Zap, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { SEO } from "@/components/SEO";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { user, error } = await authService.signIn(email, password);

      if (error) {
        toast({
          title: "❌ Error de autenticación",
          description: error.message || "Credenciales incorrectas",
          variant: "destructive",
        });
        return;
      }

      if (user) {
        toast({
          title: "✅ Bienvenido",
          description: "Inicio de sesión exitoso",
          className: "bg-accent text-accent-foreground border-accent",
        });

        const SUPER_ADMIN_EMAIL = "mxrioxw@gmail.com";
        if (user.email === SUPER_ADMIN_EMAIL) {
          router.push("/super-admin");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: "❌ Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Iniciar Sesión - Nexum Cloud"
        description="Accede a tu cuenta de Nexum Cloud y gestiona tu negocio desde cualquier lugar"
      />
      
      <div className="min-h-screen flex">
        {/* Left Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            {/* Logo & Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Coffee className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="font-heading text-4xl font-bold text-foreground">
                Nexum Cloud
              </h1>
              <p className="text-muted-foreground text-lg">
                Inicia sesión en tu cuenta
              </p>
            </div>

            {/* Login Card */}
            <Card className="border-2">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-heading">Bienvenido de vuelta</CardTitle>
                <CardDescription className="text-base">
                  Ingresa tus credenciales para continuar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 text-base"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Contraseña
                      </Label>
                      <Link
                        href="/auth/recovery"
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 text-base pr-10"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
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
                    className="w-full h-11 text-base font-semibold shadow-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Iniciando sesión...
                      </div>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                      ¿No tienes una cuenta?{" "}
                      <Link
                        href="/auth/register"
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Regístrate gratis
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="text-center space-y-3 pt-4">
              <p className="text-xs text-muted-foreground">
                🔒 Conexión segura y encriptada
              </p>
              <p className="text-xs text-muted-foreground">
                Más de 100+ negocios confían en Nexum Cloud
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Benefits (Hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary via-primary/95 to-accent relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
          
          <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 xl:px-20 text-white">
            <div className="space-y-8 max-w-lg">
              <div className="space-y-4">
                <h2 className="font-heading text-5xl font-bold leading-tight">
                  Gestiona tu negocio desde cualquier lugar
                </h2>
                <p className="text-xl text-white/90 leading-relaxed">
                  Sistema POS completo en la nube. Todo lo que necesitas para hacer crecer tu cafetería o restaurante.
                </p>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Ventas en tiempo real</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Procesa ventas, gestiona inventario y genera reportes al instante
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Dashboard inteligente</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Métricas y análisis que te ayudan a tomar mejores decisiones
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Multi-usuario</h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      Gestiona permisos de empleados y controla accesos fácilmente
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/20">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="h-10 w-10 rounded-full bg-accent border-2 border-white flex items-center justify-center text-sm font-bold">
                      A
                    </div>
                    <div className="h-10 w-10 rounded-full bg-secondary border-2 border-white flex items-center justify-center text-sm font-bold">
                      B
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary border-2 border-white flex items-center justify-center text-sm font-bold">
                      C
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">100+ negocios activos</p>
                    <p className="text-xs text-white/70">Únete a cafeterías y restaurantes exitosos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}