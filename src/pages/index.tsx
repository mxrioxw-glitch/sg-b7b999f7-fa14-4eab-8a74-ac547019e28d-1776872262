import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Coffee, TrendingUp, BarChart3, Users, ShoppingCart, Package, DollarSign, Clock, Zap, Shield, Globe, Smartphone, ChevronRight, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { default: authService } = await import("@/services/authService");
      const session = await authService.getCurrentSession();
      
      if (session) {
        // User is logged in, redirect to home
        router.replace("/home");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <>
      <SEO 
        title="Nexum Cloud - Sistema POS en la Nube"
        description="Sistema punto de venta completo para cafeterías y restaurantes. Gestiona ventas, inventario, clientes y reportes desde cualquier lugar."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header/Navbar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <Coffee className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Nexum Cloud</span>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">
                  Comenzar Gratis
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 py-20 sm:py-32 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-accent">Sistema POS en la Nube</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                    Gestiona tu negocio desde{" "}
                    <span className="text-primary">cualquier lugar</span>
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Sistema completo de punto de venta diseñado para cafeterías, restaurantes y negocios modernos. Sin instalaciones, sin complicaciones.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-base h-12" asChild>
                    <Link href="/auth/register">
                      Comenzar Gratis
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base h-12" asChild>
                    <Link href="/auth/login">
                      Iniciar Sesión
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">7 días gratis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Sin tarjeta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Configuración en 5 min</span>
                  </div>
                </div>
              </div>

              {/* Right: Visual */}
              <div className="relative hidden lg:block">
                <div className="relative rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-8 shadow-2xl">
                  <div className="space-y-6">
                    {/* Mock POS Interface */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-accent-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">Venta Rápida</h3>
                            <p className="text-sm text-white/80">3 productos</p>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white">$245.00</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/90">Café Americano</span>
                          <span className="text-white font-medium">$45.00</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/90">Croissant</span>
                          <span className="text-white font-medium">$65.00</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white/90">Jugo Natural</span>
                          <span className="text-white font-medium">$135.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <BarChart3 className="h-6 w-6 text-accent mb-2" />
                        <div className="text-2xl font-bold text-white">85%</div>
                        <div className="text-sm text-white/80">Eficiencia</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <TrendingUp className="h-6 w-6 text-accent mb-2" />
                        <div className="text-2xl font-bold text-white">+32%</div>
                        <div className="text-sm text-white/80">Ventas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Características</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Todo lo que necesitas para gestionar tu negocio
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Sistema completo con todas las herramientas que tu negocio necesita para crecer
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Punto de Venta</CardTitle>
                  <CardDescription>
                    Interfaz táctil rápida y fácil de usar. Vende en segundos, no en minutos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Inventario Inteligente</CardTitle>
                  <CardDescription>
                    Control automático de stock con alertas. Nunca te quedes sin producto.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Reportes en Tiempo Real</CardTitle>
                  <CardDescription>
                    Analiza tus ventas y toma decisiones basadas en datos reales.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Gestión de Clientes</CardTitle>
                  <CardDescription>
                    Base de datos completa con historial de compras y preferencias.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle>Corte de Caja</CardTitle>
                  <CardDescription>
                    Cierra tu día con precisión. Control total de entradas y salidas.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Empleados y Turnos</CardTitle>
                  <CardDescription>
                    Gestiona tu equipo con roles y permisos personalizados.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <Badge variant="outline">Beneficios</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                  ¿Por qué elegir Nexum Cloud?
                </h2>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">100% en la Nube</h3>
                      <p className="text-muted-foreground">Accede desde cualquier dispositivo con internet. Sin instalaciones ni actualizaciones manuales.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Diseño Responsive</h3>
                      <p className="text-muted-foreground">Funciona perfectamente en tablets, smartphones y computadoras. Optimizado para pantallas táctiles.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Seguro y Confiable</h3>
                      <p className="text-muted-foreground">Tus datos protegidos con encriptación de nivel bancario. Backups automáticos diarios.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Configuración Rápida</h3>
                      <p className="text-muted-foreground">Comienza a vender en menos de 5 minutos. Interfaz intuitiva sin curva de aprendizaje.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
                <Card className="relative border-2 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex -space-x-2">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold border-2 border-background">
                          M
                        </div>
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold border-2 border-background">
                          A
                        </div>
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold border-2 border-background">
                          L
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-xl">
                      "Transformó completamente mi cafetería"
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Desde que implementamos Nexum Cloud, nuestras ventas aumentaron un 35%. La facilidad de uso y los reportes en tiempo real nos permiten tomar mejores decisiones cada día.
                    </p>
                    <div>
                      <p className="font-semibold text-foreground">María González</p>
                      <p className="text-sm text-muted-foreground">Dueña de Café Aroma</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <div className="text-center space-y-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Comienza hoy mismo
              </h2>
              <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Únete a cientos de negocios que ya confían en Nexum Cloud para gestionar sus ventas
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="secondary" className="text-base h-12 min-w-[200px]" asChild>
                  <Link href="/auth/register">
                    Comenzar Gratis
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-primary-foreground/80">
                  7 días gratis • Sin tarjeta de crédito
                </p>
              </div>

              <div className="flex items-center justify-center gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-primary-foreground/80">Negocios activos</div>
                </div>
                <div className="h-12 w-px bg-primary-foreground/20"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-sm text-primary-foreground/80">Ventas diarias</div>
                </div>
                <div className="h-12 w-px bg-primary-foreground/20"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-sm text-primary-foreground/80">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div>
                <Link href="/" className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-foreground">Nexum Cloud</span>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Sistema POS profesional en la nube para negocios modernos.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Producto</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-foreground transition-colors">Características</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Precios</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Demo</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Soporte</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-foreground transition-colors">Centro de Ayuda</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Contacto</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Estado del Sistema</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-foreground transition-colors">Términos</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Cookies</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-8">
              <p className="text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Nexum Cloud. Sistema POS profesional en la nube.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}