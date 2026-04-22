import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        toast({
          title: "❌ Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSuccess(true);
      toast({
        title: "✅ Contraseña actualizada",
        description: "Redirigiendo al inicio de sesión...",
        className: "bg-accent text-accent-foreground border-accent",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Restablecer Contraseña - Nexum Cloud"
        description="Restablece tu contraseña en Nexum Cloud"
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
              <CardTitle>Restablecer Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {success ? (
                <Alert className="bg-accent/10 border-accent">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <AlertDescription className="text-accent">
                    ¡Contraseña actualizada exitosamente! Redirigiendo...
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Nueva Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      "Restablecer Contraseña"
                    )}
                  </Button>

                  <div className="text-center text-sm">
                    <Link 
                      href="/auth/login" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}