import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/router";
import { Mail, CheckCircle2, ArrowRight, RefreshCcw, Coffee, Store } from "lucide-react";
import { useState } from "react";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { email } = router.query;
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    if (!email || typeof email !== "string") {
      toast({
        title: "❌ Error",
        description: "No se pudo determinar el correo electrónico",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    try {
      // Reenviar email de verificación
      const { error } = await authService.resendVerificationEmail(email);
      
      if (error) {
        toast({
          title: "❌ Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Correo reenviado",
        description: "Revisa tu bandeja de entrada nuevamente",
        className: "bg-accent text-accent-foreground border-accent",
      });
    } catch (error) {
      console.error("Error resending email:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo reenviar el correo",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <SEO
        title="Verifica tu correo - NextCoffee"
        description="Verifica tu correo electrónico para activar tu cuenta de NextCoffee"
      />

      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Store className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-3xl font-bold">
                NextCoffee
              </h1>
            </div>
            <p className="text-muted-foreground">
              Sistema POS Profesional en la Nube
            </p>
          </div>

          {/* Main Card */}
          <Card className="border-2 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-heading">
                  ¡Revisa tu correo electrónico!
                </CardTitle>
                <CardDescription className="text-base">
                  Te hemos enviado un email de verificación a
                </CardDescription>
                {email && (
                  <p className="text-lg font-semibold text-foreground">
                    {email}
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Instructions */}
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    1
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold text-foreground mb-1">
                      Abre tu correo electrónico
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Busca un email de Nexum Cloud en tu bandeja de entrada
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    2
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold text-foreground mb-1">
                      Haz clic en el enlace de verificación
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      El enlace te redirigirá para activar tu cuenta
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                    3
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="font-semibold text-foreground mb-1">
                      ¡Listo! Inicia sesión
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Una vez verificado, podrás iniciar sesión y usar Nexum Cloud
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  Consejos útiles:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li className="flex gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Revisa tu correo</p>
                      <p className="text-sm text-muted-foreground">
                        Busca un email de NextCoffee en tu bandeja de entrada
                      </p>
                    </div>
                  </li>
                  <li>• El email puede tardar unos minutos en llegar</li>
                  <li>• Asegúrate de que tu email esté escrito correctamente</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={handleResendEmail}
                  disabled={resending}
                >
                  {resending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Reenviando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Reenviar correo de verificación
                    </div>
                  )}
                </Button>

                <Link href="/auth/login">
                  <Button className="w-full h-12 text-base">
                    Ir a Iniciar Sesión
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Help */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ¿Problemas con la verificación?{" "}
                  <a
                    href="mailto:soporte@nexumcloud.com"
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Contáctanos
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Al verificar tu email, aceptas nuestros{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Términos de Servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}