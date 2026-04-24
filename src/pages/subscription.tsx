import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle2 } from "lucide-react";
import { businessService } from "@/services/businessService";
import { authService } from "@/services/authService";

export default function SubscriptionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "");
      }
      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessName(business.name);
      }
    };
    loadData();
  }, []);

  return (
    <ProtectedRoute>
      <SEO title="Suscripción - NextCoffee" description="Gestiona tu suscripción" />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header 
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                Suscripción y Facturación
              </h1>
              
              <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
                <CardContent className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Próximamente
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                    El sistema de planes y suscripciones estará disponible muy pronto. Por ahora, disfruta de todas las funciones sin restricciones ni costos adicionales.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    ¡Acceso total gratuito activado!
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}