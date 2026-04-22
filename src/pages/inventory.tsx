import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { InventoryForm } from "@/components/InventoryForm";
import { InventoryAdjustForm } from "@/components/InventoryAdjustForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { getInventoryItems, getLowStockItems, deleteInventoryItem } from "@/services/inventoryService";
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, History, TrendingDown, TrendingUp } from "lucide-react";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";
import type { Database } from "@/integrations/supabase/types";
import { GetServerSidePropsContext } from "next";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

export const getServerSideProps = requireActiveSubscription;

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredPermission="inventory" requireWrite>
      <InventoryContent />
    </ProtectedRoute>
  );
}

function InventoryContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) {
        router.push("/auth/login");
        return;
      }

      const [itemsData, lowStockData] = await Promise.all([
        getInventoryItems(business.id),
        getLowStockItems(business.id),
      ]);

      setItems(itemsData);
      setLowStockItems(lowStockData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este insumo?")) return;

    try {
      const item = items.find(i => i.id === id);
      await inventoryService.deleteInventoryItem(id);
      toast({
        title: "🗑️ Insumo eliminado",
        description: item?.name || "Insumo eliminado del inventario",
        duration: 3000,
      });
      await loadInventoryItems(businessId!);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el insumo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setIsAdjustModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    loadData();
  };

  const handleAdjustModalClose = () => {
    setIsAdjustModalOpen(false);
    setAdjustingItem(null);
    loadData();
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLowStock = (item: InventoryItem) => {
    return Number(item.current_stock) <= Number(item.min_stock);
  };

  async function handleSave() {
    if (!businessId) return;

    try {
      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem.id, formData);
        toast({
          title: "✅ Insumo actualizado",
          description: `${formData.name} - Stock: ${formData.current_stock} ${formData.unit}`,
          className: "bg-accent text-accent-foreground border-accent",
        });
      } else {
        await inventoryService.createInventoryItem(businessId, formData);
        toast({
          title: "✅ Insumo creado",
          description: `${formData.name} agregado al inventario`,
          className: "bg-accent text-accent-foreground border-accent",
        });
      }
      await loadInventoryItems(businessId);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo guardar el insumo",
        variant: "destructive",
      });
    }
  }

  async function handleAdjustmentSave(data: { reason: string; quantity: number; type: "add" | "subtract" }) {
    if (!adjustingItem || !businessId) return;

    try {
      const newStock = data.type === "add"
        ? adjustingItem.current_stock + data.quantity
        : adjustingItem.current_stock - data.quantity;

      await inventoryService.updateInventoryItem(adjustingItem.id, {
        current_stock: newStock,
      });

      await inventoryService.createInventoryAdjustment({
        business_id: businessId,
        inventory_item_id: adjustingItem.id,
        adjustment_type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      });

      toast({
        title: `${data.type === "add" ? "📈" : "📉"} Ajuste registrado`,
        description: `${adjustingItem.name}: ${data.type === "add" ? "+" : "-"}${data.quantity} ${adjustingItem.unit}`,
        className: "bg-accent text-accent-foreground border-accent",
      });

      await loadInventoryItems(businessId);
      setAdjustingItem(null);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo registrar el ajuste",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <SEO 
          title="Inventario - Nexum Cloud"
          description="Gestión de inventario"
        />
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Inventario
            </h1>
            <p className="text-muted">
              Gestiona tus insumos y controla el stock
            </p>
          </div>

          {lowStockItems.length > 0 && (
            <Alert className="mb-6 border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-800 font-semibold">
                Alerta de Bajo Stock
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                Hay {lowStockItems.length} insumo(s) con stock bajo o agotado
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Insumos</CardTitle>
                  <CardDescription>
                    {filteredItems.length} insumos en inventario
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push("/inventory/kardex")}>
                    <History className="w-4 h-4 mr-2" />
                    Ver Kardex
                  </Button>
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Insumo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Buscar insumos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted">Cargando inventario...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted mb-4">
                    No hay insumos registrados
                  </p>
                  <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer insumo
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Costo/Unidad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          {Number(item.current_stock).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {Number(item.min_stock).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${Number(item.cost_per_unit).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {isLowStock(item) ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Bajo Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-accent text-white">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAdjust(item)}
                              title="Ajustar stock"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Insumo" : "Nuevo Insumo"}
            </DialogTitle>
            <DialogDescription>
              Configura los detalles del insumo
            </DialogDescription>
          </DialogHeader>
          <InventoryForm item={editingItem} onClose={handleModalClose} />
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              Registra entradas o salidas de inventario
            </DialogDescription>
          </DialogHeader>
          <InventoryAdjustForm
            item={adjustingItem}
            onClose={handleAdjustModalClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}