import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Users, Clock, CheckCircle, ClipboardList } from "lucide-react";
import { requireActiveSubscription } from "@/middleware/subscription";

export const getServerSideProps = requireActiveSubscription;

export default function ComedorPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);

  return (
    <ProtectedRoute requiredPermission="can_view_sales">
      <SEO 
        title="Comedor - Sistema de Gestión de Mesas"
        description="Módulo de gestión de comedor para restaurantes"
      />
      
      <FeatureGuard feature="comedor">
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Preview Content */}
                <div className="space-y-2 mb-6">
                  <h1 className="font-heading text-3xl md:text-4xl font-bold">
                    Gestión de Comedor
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Sistema completo para gestión de mesas y órdenes en restaurantes
                  </p>
                </div>

                {/* Feature Preview Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <UtensilsCrossed className="h-5 w-5 text-accent" />
                        </div>
                        <CardTitle className="text-lg">Gestión de Mesas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Controla la disponibilidad, ocupación y estado de todas tus mesas en tiempo real
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <ClipboardList className="h-5 w-5 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">Órdenes por Mesa</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Levanta órdenes desde el comedor y envíalas directamente a cocina
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Users className="h-5 w-5 text-purple-500" />
                        </div>
                        <CardTitle className="text-lg">Asignación de Meseros</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Asigna meseros a secciones y da seguimiento a su desempeño
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Clock className="h-5 w-5 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">Tiempo de Servicio</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Monitorea tiempos de atención y optimiza el servicio al cliente
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <CheckCircle className="h-5 w-5 text-orange-500" />
                        </div>
                        <CardTitle className="text-lg">Control de Cuentas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Divide cuentas, aplica propinas y gestiona pagos por mesa
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Coming Soon Modal */}
        <ComingSoonModal
          isOpen={showComingSoon}
          onClose={() => setShowComingSoon(false)}
          moduleName="Módulo Comedor"
          moduleDescription="Sistema completo de gestión de mesas, órdenes y servicio para restaurantes"
          estimatedDate="T1 2026"
          icon={UtensilsCrossed}
          features={[
            "Mapa visual de mesas con estados en tiempo real",
            "Levantamiento de órdenes desde el comedor",
            "Asignación de meseros y control de secciones",
            "División de cuentas y gestión de propinas",
            "Sincronización automática con cocina",
            "Reportes de rotación y tiempos de servicio",
            "Notificaciones para meseros y cocina",
            "Soporte para reservaciones",
          ]}
        />
      </FeatureGuard>
    </ProtectedRoute>
  );
}