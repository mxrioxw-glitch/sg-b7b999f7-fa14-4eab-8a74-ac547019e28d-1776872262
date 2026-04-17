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
import { Coffee, AlertCircle, CheckCircle2, Store } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    fullName: ""
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

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!formData.fullName.trim()) {
      setError("El nombre completo es requerido");
      return;
    }

    if (!formData.businessName.trim()) {
      setError("El nombre del negocio es requerido");
      return;
    }

    setLoading(true);

    try {
      // Registrar usuario
      const { user } = await authService.signUpWithEmail(formData.email, formData.password);

      if (!user) {
        throw new Error("No se pudo crear el usuario");
      }

      // Crear business
      const business = await businessService.createBusiness({
        name: formData.businessName,
        owner_id: user.id,
      });

      if (!business) {
        throw new Error("No se pudo crear el negocio");
      }

      // Crear suscripción de prueba
      await subscriptionService.createTrialSubscription(user.id, business.id);

      // Crear empleado owner
      const { data: employeeData, error: employeeError } = await supabase.functions.invoke("create-employee", {
        body: {
          businessId: business.id,
          email: formData.email,
          name: formData.fullName,
          role: "owner",
          permissions: {
            pos: true,
            products: true,
            inventory: true,
            customers: true,
            reports: true,
            settings: true,
            employees: true,
          },
        },
      });

      if (employeeError) {
        console.error("Error creating employee:", employeeError);
      }

      router.push("/home");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Crear Cuenta - Nexum Cloud"
        description="Crea tu cuenta en Nexum Cloud y comienza tu prueba gratis"
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
              Crea tu cuenta y comienza tu prueba gratis de 7 días
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Crear Cuenta</CardTitle>
              <CardDescription>
                Regístrate y comienza a vender hoy mismo
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

                <Alert className="bg-accent/10 border-accent">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <AlertDescription className="text-accent">
                    <strong>7 días gratis</strong> · Sin tarjeta de crédito
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Nombre del negocio</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="Cafetería Central"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

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
                  <Label htmlFor="password">Contraseña</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
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
                  {loading ? "Creando cuenta..." : "Crear Cuenta Gratis"}
                </Button>

                <p className="text-sm text-center text-muted">
                  ¿Ya tienes cuenta?{" "}
                  <Link 
                    href="/auth/login" 
                    className="text-accent hover:underline font-medium"
                  >
                    Inicia sesión
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