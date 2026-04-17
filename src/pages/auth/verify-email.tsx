import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coffee, Mail, CheckCircle2, AlertCircle, Store } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { email } = router.query;
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResendEmail = async () => {
    if (!email || typeof email !== "string") {
      setError("No se encontró el email. Por favor regístrate de nuevo.");
      return;
    }

    setResending(true);
    setMessage("");
    setError("");

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setMessage("¡Email de confirmación reenviado! Revisa tu bandeja de entrada.");
      }
    } catch (err) {
      setError("Error al reenviar el email. Por favor intenta de nuevo.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <SEO 
        title="Verificar Email - Nexum Cloud"
        description="Verifica tu email en Nexum Cloud"
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
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-accent" />
              </div>
              <CardTitle className="text-center">Verifica tu Email</CardTitle>
              <CardDescription className="text-center">
                Te hemos enviado un email de confirmación
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Hemos enviado un enlace de verificación a:
                  <br />
                  <strong className="text-foreground">{email || "tu email"}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted">
                <p>Por favor sigue estos pasos:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Abre tu bandeja de entrada</li>
                  <li>Busca el email de POS SaaS</li>
                  <li>Haz clic en el enlace de confirmación</li>
                  <li>Inicia sesión con tus credenciales</li>
                </ol>
              </div>

              {message && (
                <Alert className="bg-accent/10 border-accent">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <AlertDescription className="text-accent">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="pt-4 space-y-2">
                <p className="text-sm text-center text-muted">
                  ¿No recibiste el email?
                </p>
                <Button 
                  onClick={handleResendEmail}
                  disabled={resending}
                  variant="outline"
                  className="w-full"
                >
                  {resending ? "Reenviando..." : "Reenviar email de confirmación"}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2">
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login">
                  Volver al inicio de sesión
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}