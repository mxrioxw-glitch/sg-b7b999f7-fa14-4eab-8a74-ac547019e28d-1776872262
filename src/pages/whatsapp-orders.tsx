import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { FeatureGuard } from "@/components/FeatureGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, CheckCheck, TrendingUp, Users, ShoppingBag } from "lucide-react";
import { requireActiveSubscription } from "@/middleware/subscription";

export const getServerSideProps = requireActiveSubscription;

export default function WhatsAppOrdersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);

  return (
    <ProtectedRoute requiredPermission="can_view_sales">
      <SEO 
        title="Órdenes por WhatsApp"
        description="Sistema de gestión de pedidos vía WhatsApp"
      />
      
      <FeatureGuard feature="whatsapp_orders">
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
                    Órdenes por WhatsApp
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Recibe, gestiona y procesa pedidos directamente desde WhatsApp
                  </p>
                </div>

                {/* Feature Preview Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <MessageSquare className="h-5 w-5 text-accent" />
                        </div>
                        <CardTitle className="text-lg">Integración WhatsApp</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Conecta tu número de WhatsApp Business para recibir pedidos
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <ShoppingBag className="h-5 w-5 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">Catálogo Digital</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Comparte tu menú digital con precios e imágenes por WhatsApp
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Send className="h-5 w-5 text-purple-500" />
                        </div>
                        <CardTitle className="text-lg">Respuestas Automáticas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Configura respuestas automáticas para consultas frecuentes
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <CheckCheck className="h-5 w-5 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">Confirmación de Pedidos</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Envía confirmaciones automáticas con resumen y tiempo estimado
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Users className="h-5 w-5 text-orange-500" />
                        </div>
                        <CardTitle className="text-lg">Base de Clientes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Guarda automáticamente clientes y su historial de pedidos
                      </CardDescription>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <TrendingUp className="h-5 w-5 text-red-500" />
                        </div>
                        <CardTitle className="text-lg">Análisis de Ventas</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Reportes de pedidos, horarios pico y productos más solicitados
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
          moduleName="Órdenes por WhatsApp"
          moduleDescription="Acepta y gestiona pedidos directamente desde WhatsApp con automatización inteligente"
          estimatedDate="T1 2026"
          icon={MessageSquare}
          features={[
            "Integración con WhatsApp Business API",
            "Catálogo digital de productos con imágenes",
            "Mensajes automáticos de bienvenida y confirmación",
            "Gestión de pedidos desde el panel de administración",
            "Actualización automática de inventario",
            "Notificaciones de estado del pedido al cliente",
            "Base de datos de clientes automática",
            "Reportes y análisis de ventas por WhatsApp",
          ]}
        />
      </FeatureGuard>
    </ProtectedRoute>
  );
}