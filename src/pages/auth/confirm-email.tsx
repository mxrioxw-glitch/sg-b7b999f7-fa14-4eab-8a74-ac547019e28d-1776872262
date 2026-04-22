import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
import { CheckCircle2, XCircle, Loader2, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          setStatus("error");
          setMessage("Error al verificar tu cuenta. El enlace puede haber expirado.");
          return;
        }

        if (user) {
          // Email verificado exitosamente, ahora crear el negocio
          try {
            // Obtener el nombre del negocio de localStorage
            const businessName = localStorage.getItem('pendingBusinessName') || 'Mi Negocio';
            
            // Crear negocio
            const { business, error: businessError } = await businessService.createBusiness({
              name: businessName,
            });

            if (businessError || !business) {
              console.error("Error creating business:", businessError);
              throw new Error(businessError || "No se pudo crear el negocio");
            }

            // Crear suscripción trial
            const { error: subscriptionError } = await subscriptionService.createTrialSubscription(business.id);
            
            if (subscriptionError) {
              console.error("Error creating trial subscription:", subscriptionError);
            }

            // Crear empleado owner
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

            // Limpiar localStorage
            localStorage.removeItem('pendingBusinessName');
            localStorage.removeItem('pendingUserEmail');

            setStatus("success");
            setMessage("¡Tu cuenta ha sido verificada exitosamente! Tu negocio está listo.");

            // Toast de éxito
            toast({
              title: "✅ ¡Cuenta verificada!",
              description: "Tu negocio ha sido creado. Redirigiendo...",
              className: "bg-accent text-accent-foreground border-accent",
            });

            // Redirigir a login después de 3 segundos
            setTimeout(() => {
              router.push("/auth/login");
            }, 3000);
          } catch (setupError: any) {
            console.error("Error setting up business:", setupError);
            setStatus("error");
            setMessage("Tu email fue verificado, pero hubo un error al crear tu negocio. Por favor contacta a soporte.");
          }
        } else {
          setStatus("error");
          setMessage("No se pudo verificar tu cuenta. Por favor intenta de nuevo.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Ocurrió un error inesperado.");
      }
    };

    handleEmailConfirmation();
  }, [router, toast]);

  return (
    <>
      <SEO 
        title="Confirmar Email - Nexum Cloud"
        description="Confirma tu email en Nexum Cloud"
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Confirmación de Email</CardTitle>
              <CardDescription>
                {status === "loading" ? "Verificando tu cuenta" : 
                 status === "success" ? "¡Listo para comenzar!" : 
                 "Hubo un problema"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {status === "loading" && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Verificando tu cuenta y creando tu negocio...
                  </AlertDescription>
                </Alert>
              )}

              {status === "success" && (
                <>
                  <Alert className="bg-accent/10 border-accent">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-accent">
                      {message}
                    </AlertDescription>
                  </Alert>
                  <p className="text-sm text-muted-foreground text-center">
                    Serás redirigido al inicio de sesión en unos segundos...
                  </p>
                </>
              )}

              {status === "error" && (
                <>
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                      <Link href="/auth/login">
                        Ir al inicio de sesión
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/auth/register">
                        Crear nueva cuenta
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}