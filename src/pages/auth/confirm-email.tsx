import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coffee, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check if user just confirmed their email via the link
    const handleEmailConfirmation = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          setStatus("error");
          setMessage("Error al verificar tu cuenta. El enlace puede haber expirado.");
          return;
        }

        if (user) {
          setStatus("success");
          setMessage("¡Tu cuenta ha sido verificada exitosamente!");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
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
  }, [router]);

  return (
    <>
      <SEO 
        title="Confirmar Email - POS SaaS"
        description="Confirma tu cuenta de email"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-card mb-4">
              <Coffee className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">POS SaaS</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Confirmación de Email</CardTitle>
              <CardDescription>
                Verificando tu cuenta
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {status === "loading" && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Verificando tu cuenta...
                  </AlertDescription>
                </Alert>
              )}

              {status === "success" && (
                <Alert className="bg-accent/10 border-accent">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <AlertDescription className="text-accent">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {status === "success" && (
                <p className="text-sm text-muted text-center">
                  Serás redirigido al inicio de sesión en unos segundos...
                </p>
              )}

              {status === "error" && (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}