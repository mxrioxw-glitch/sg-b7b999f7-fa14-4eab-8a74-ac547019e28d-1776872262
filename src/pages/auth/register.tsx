import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { signUpWithEmail } from "@/services/authService";
import { createBusiness } from "@/services/businessService";
import { createSubscription, getFreePlan } from "@/services/subscriptionService";
import { Coffee, AlertCircle, CheckCircle2 } from "lucide-react";

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

    setLoading(true);

    try {
      // 1. Create user account
      const { data: authData, error: signUpError } = await signUpWithEmail(
        formData.email, 
        formData.password
      );

      if (signUpError || !authData.user) {
        setError(signUpError?.message || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // 2. Create business
      const { data: businessData, error: businessError } = await createBusiness({
        owner_id: userId,
        name: formData.businessName,
        email: formData.email
      });

      if (businessError || !businessData) {
        setError("Error al crear el negocio");
        setLoading(false);
        return;
      }

      // 3. Get free trial plan
      const { data: freePlan, error: planError } = await getFreePlan();

      if (planError || !freePlan) {
        setError("Error al activar el plan gratuito");
        setLoading(false);
        return;
      }

      // 4. Create subscription with 7-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const { error: subscriptionError } = await createSubscription({
        business_id: businessData.id,
        plan_id: freePlan.id,
        status: "trialing",
        trial_ends_at: trialEndsAt.toISOString()
      });

      if (subscriptionError) {
        setError("Error al activar la prueba gratuita");
        setLoading(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push("/");
    } catch (err) {
      setError("Error inesperado. Por favor intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Registro - POS SaaS"
        description="Regístrate y obtén 7 días gratis de POS SaaS"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-card mb-4">
              <Coffee className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">POS SaaS</h1>
            <p className="text-muted mt-2">Comienza tu prueba gratuita de 7 días</p>
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