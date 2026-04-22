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
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
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
      // 1. Registrar usuario
      const { user, error: signUpError } = await authService.signUp(
        formData.email, 
        formData.password, 
        formData.fullName
      );

      if (signUpError || !user) {
        const errorMsg = typeof signUpError === 'string' 
          ? signUpError 
          : (signUpError as any)?.message || "No se pudo crear el usuario";
        throw new Error(errorMsg);
      }

      // Esperar un momento para que el perfil se cree
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Crear negocio
      const { business, error: businessError } = await businessService.createBusiness({
        name: formData.businessName,
      });

      if (businessError || !business) {
        console.error("Error creating business:", businessError);
        throw new Error(businessError || "No se pudo crear el negocio");
      }

      // 3. Crear suscripción trial
      const { error: subscriptionError } = await subscriptionService.createTrialSubscription(business.id);
      
      if (subscriptionError) {
        console.error("Error creating trial subscription:", subscriptionError);
        // No lanzamos error aquí, el negocio ya existe
      }

      // 4. Crear empleado owner
      try {
        const { error: employeeError } = await supabase
          .from("employees")
          .insert({
            business_id: business.id,
            user_id: user.id,
            role: "owner",
            is_active: true
          });

        if (employeeError) {
          console.error("Error creating employee record:", employeeError);
        }
      } catch (employeeErr) {
        console.error("Error inserting employee record:", employeeErr);
      }

      // 5. Redirigir a la página de verificación de email
      toast({
        title: "✅ ¡Cuenta creada exitosamente!",
        description: "Por favor, verifica tu correo electrónico",
        className: "bg-accent text-accent-foreground border-accent",
      });

      // Redirigir a página de verificación con el email
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Error en el registro. Por favor, intenta de nuevo.");
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