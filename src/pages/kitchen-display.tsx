import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Monitor, Bell, TrendingUp, Timer, List } from "lucide-react";
import { requireActiveSubscription } from "@/middleware/subscription";

export const getServerSideProps = requireActiveSubscription;

export default function KitchenDisplayPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);

  return (
    <ProtectedRoute requiredPermission="can_view_sales">
      <SEO 
        title="Pantalla de Cocina - KDS"
        description="Kitchen Display System para gestión de órdenes en cocina"
      />
      
      <FeatureGuard feature="kitchen_display">
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
                    Kitchen Display System (KDS)
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Pantalla digital para gestión y seguimiento de órdenes en cocina
                  </p>
                </div>

                {/* Feature Preview Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Monitor className="h-5 w-5 text-accent" />
                        </div>
                        <CardTitle className="text-lg">Pantalla en Tiempo Real</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Visualiza todas las órdenes activas en una pantalla optimizada para cocina
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <List className="h-5 w-5 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">Cola de Órdenes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Organización automática por prioridad y tiempo de preparación
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Bell className="h-5 w-5 text-purple-500" />
                        </div>
                        <CardTitle className="text-lg">Alertas y Notificaciones</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Avisos sonoros y visuales para nuevas órdenes y tiempos críticos
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Timer className="h-5 w-5 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">Control de Tiempos</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Cronómetros automáticos y alertas por tiempos de preparación
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <ChefHat className="h-5 w-5 text-orange-500" />
                        </div>
                        <CardTitle className="text-lg">Estaciones de Trabajo</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Divide órdenes por estaciones: parrilla, frío, bebidas, postres
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <TrendingUp className="h-5 w-5 text-red-500" />
                        </div>
                        <CardTitle className="text-lg">Reportes de Cocina</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Análisis de tiempos de preparación y eficiencia del equipo
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
          moduleName="Pantalla de Cocina (KDS)"
          moduleDescription="Sistema profesional de gestión de órdenes para optimizar la operación de tu cocina"
          estimatedDate="T1 2026"
          icon={ChefHat}
          features={[
            "Pantalla optimizada para visualización en cocina",
            "Organización automática de órdenes por prioridad",
            "Alertas sonoras y visuales para nuevas órdenes",
            "Control de tiempos de preparación en tiempo real",
            "División por estaciones de trabajo",
            "Sincronización automática con comedor y POS",
            "Reportes de eficiencia y tiempos promedio",
            "Soporte para múltiples pantallas simultáneas",
          ]}
        />
      </FeatureGuard>
    </ProtectedRoute>
  );
}