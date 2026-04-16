import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { subscriptionService } from "@/services/subscriptionService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Zap, ArrowRight } from "lucide-react";

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGuard({ feature, children, fallback }: FeatureGuardProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  async function checkAccess() {
    try {
      const result = await subscriptionService.hasFeatureAccess(feature);
      setHasAccess(result.hasAccess);
    } catch (error) {
      console.error("Error checking feature access:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Funcionalidad Bloqueada</CardTitle>
          <CardDescription>
            Esta funcionalidad no está disponible en tu plan actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-accent" />
              <span className="font-medium text-sm">Desbloquea esta funcionalidad</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Actualiza tu plan para acceder a todas las funcionalidades premium
            </p>
          </div>
          <Button 
            className="w-full" 
            onClick={() => router.push("/subscription")}
          >
            Ver Planes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}