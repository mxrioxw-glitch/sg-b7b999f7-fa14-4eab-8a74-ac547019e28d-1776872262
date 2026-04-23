import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useState } from "react";
import { authService } from "@/services/authService";
import { Coffee, AlertCircle, CheckCircle2, ArrowLeft, Store } from "lucide-react";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error: resetError } = await authService.resetPassword(email);
      
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Error al enviar el correo de recuperación. Por favor intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Recuperar Contraseña - NextCoffee"
        description="Recupera el acceso a tu cuenta"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Store className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="font-heading text-3xl font-bold">NextCoffee</h1>
            </div>
            <p className="text-muted-foreground">
              Recupera el acceso a tu cuenta
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recuperar Contraseña</CardTitle>
              <CardDescription>
                Te enviaremos un enlace para restablecer tu contraseña
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

                {success && (
                  <Alert className="bg-accent/10 border-accent">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-accent">
                      <strong>¡Correo enviado!</strong><br />
                      Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    </AlertDescription>
                  </Alert>
                )}

                {!success && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                {!success ? (
                  <>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                    </Button>

                    <Link 
                      href="/auth/login" 
                      className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver al inicio de sesión
                    </Link>
                  </>
                ) : (
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" className="w-full">
                      Ir al inicio de sesión
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}