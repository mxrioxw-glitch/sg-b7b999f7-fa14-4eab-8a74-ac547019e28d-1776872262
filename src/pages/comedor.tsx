import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeatureGuard } from "@/components/FeatureGuard";
import { TableGrid } from "@/components/TableGrid";
import { TableControlPanel } from "@/components/TableControlPanel";
import { ProductSelectorModal } from "@/components/ProductSelectorModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, DollarSign, Clock, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requireActiveSubscription } from "@/middleware/subscription";
import { tableService } from "@/services/tableService";
import { employeeService } from "@/services/employeeService";
import { productService } from "@/services/productService";
import { businessService } from "@/services/businessService";
import { authService } from "@/services/authService";

export const getServerSideProps = requireActiveSubscription;

export default function ComedorPage() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data
  const [tables, setTables] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  
  // UI State
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedTableOrder, setSelectedTableOrder] = useState<any>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [showOpenTableModal, setShowOpenTableModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  
  // Modal State
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableArea, setNewTableArea] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [selectedWaiterId, setSelectedWaiterId] = useState("");
  const [productSelectorCallback, setProductSelectorCallback] = useState<((product: any) => void) | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      
      const session = await authService.getCurrentSession();
      if (!session?.user?.id) {
        toast({
          title: "❌ Error",
          description: "No se pudo obtener la sesión del usuario",
          variant: "destructive",
        });
        return;
      }

      const business = await businessService.getCurrentBusiness();
      if (!business) {
        toast({
          title: "❌ Error",
          description: "No se pudo obtener el negocio del usuario",
          variant: "destructive",
        });
        return;
      }

      setBusinessId(business.id);

      const [tablesData, employeesData, productsData] = await Promise.all([
        tableService.getTables(business.id),
        employeeService.getEmployees(business.id),
        productService.getProducts(business.id),
      ]);

      setTables(tablesData);
      setEmployees(employeesData.filter(e => e.role === "waiter" || e.role === "manager" || e.role === "admin"));
      setProducts(productsData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTableClick(table: any) {
    setSelectedTable(table);
    
    if (table.status === "occupied") {
      try {
        const order = await tableService.getTableOrder(table.id);
        setSelectedTableOrder(order);
        setShowControlPanel(true);
      } catch (error: any) {
        console.error("Error loading table order:", error);
        toast({
          title: "❌ Error",
          description: "No se pudo cargar la orden de la mesa",
          variant: "destructive",
        });
      }
    } else if (table.status === "available") {
      setShowOpenTableModal(true);
    } else if (table.status === "dirty") {
      // Opción para limpiar mesa
      try {
        await tableService.setTableAvailable(table.id);
        toast({
          title: "✅ Mesa limpia",
          description: "La mesa está lista para usarse",
          className: "bg-accent text-accent-foreground",
        });
        loadInitialData();
      } catch (error: any) {
        toast({
          title: "❌ Error",
          description: "No se pudo limpiar la mesa",
          variant: "destructive",
        });
      }
    }
  }

  async function handleOpenTable() {
    if (!selectedTable || !selectedWaiterId) {
      toast({
        title: "❌ Datos incompletos",
        description: "Selecciona un mesero",
        variant: "destructive",
      });
      return;
    }

    try {
      const order = await tableService.openTable({
        table_id: selectedTable.id,
        business_id: businessId,
        assigned_waiter_id: selectedWaiterId,
        guests_count: guestsCount,
        status: "open",
      });

      setSelectedTableOrder(order);
      setShowOpenTableModal(false);
      setShowControlPanel(true);
      
      toast({
        title: "✅ Mesa abierta",
        description: `Mesa ${selectedTable.table_number} lista para tomar órdenes`,
        className: "bg-accent text-accent-foreground",
      });

      loadInitialData();
    } catch (error: any) {
      console.error("Error opening table:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo abrir la mesa",
        variant: "destructive",
      });
    }
  }

  async function handleCreateTable() {
    if (!newTableNumber || newTableCapacity < 1) {
      toast({
        title: "❌ Datos incompletos",
        description: "Completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      await tableService.createTable({
        business_id: businessId,
        table_number: newTableNumber,
        capacity: newTableCapacity,
        area: newTableArea || null,
        status: "available",
      });

      toast({
        title: "✅ Mesa creada",
        description: `Mesa ${newTableNumber} agregada exitosamente`,
        className: "bg-accent text-accent-foreground",
      });

      setShowCreateTableModal(false);
      setNewTableNumber("");
      setNewTableCapacity(4);
      setNewTableArea("");
      loadInitialData();
    } catch (error: any) {
      console.error("Error creating table:", error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudo crear la mesa",
        variant: "destructive",
      });
    }
  }

  function handleOpenProductSelector(callback: (product: any) => void) {
    setProductSelectorCallback(() => callback);
    setShowProductModal(true);
  }

  function handleProductSelect(product: any) {
    if (productSelectorCallback) {
      productSelectorCallback(product);
      setProductSelectorCallback(null);
    }
    setShowProductModal(false);
  }

  function handleProceedToCheckout(order: any) {
    setShowCheckoutModal(true);
  }

  async function handleCheckoutComplete() {
    setShowCheckoutModal(false);
    setShowControlPanel(false);
    setSelectedTable(null);
    setSelectedTableOrder(null);
    loadInitialData();
  }

  const stats = {
    totalTables: tables.length,
    occupied: tables.filter(t => t.status === "occupied").length,
    available: tables.filter(t => t.status === "available").length,
    revenue: tables
      .filter(t => t.status === "occupied")
      .reduce((sum, t) => sum + Number(t.table_orders?.[0]?.total || 0), 0),
  };

  return (
    <ProtectedRoute requiredPermission="can_view_sales">
      <SEO 
        title="Comedor - Gestión de Mesas"
        description="Sistema de gestión de mesas para restaurantes"
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
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold">
                      Gestión de Comedor
                    </h1>
                    <p className="text-base text-muted-foreground mt-1">
                      Control de mesas y órdenes en tiempo real
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={loadInitialData}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={() => setShowCreateTableModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Mesa
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Mesas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalTables}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ocupadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-accent">{stats.occupied}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Disponibles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ingresos Actuales
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tables Grid */}
                {isLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-4">Cargando mesas...</p>
                  </div>
                ) : tables.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay mesas configuradas</h3>
                    <p className="text-muted-foreground mb-6">
                      Crea tu primera mesa para comenzar a gestionar el comedor
                    </p>
                    <Button onClick={() => setShowCreateTableModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primera Mesa
                    </Button>
                  </Card>
                ) : (
                  <TableGrid
                    tables={tables}
                    onTableClick={handleTableClick}
                    selectedTableId={selectedTable?.id}
                  />
                )}
              </div>
            </main>
          </div>
        </div>

        {/* Control Panel Sheet */}
        <Sheet open={showControlPanel} onOpenChange={setShowControlPanel}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0">
            {selectedTable && (
              <TableControlPanel
                table={selectedTable}
                order={selectedTableOrder}
                employees={employees}
                onClose={() => setShowControlPanel(false)}
                onRefresh={loadInitialData}
                onOpenProductSelector={handleOpenProductSelector}
                onProceedToCheckout={handleProceedToCheckout}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Open Table Modal */}
        <Dialog open={showOpenTableModal} onOpenChange={setShowOpenTableModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Mesa {selectedTable?.table_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Número de Comensales</Label>
                <Input
                  type="number"
                  min={1}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mesero Asignado</Label>
                <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mesero" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOpenTableModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpenTable}>
                Abrir Mesa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Table Modal */}
        <Dialog open={showCreateTableModal} onOpenChange={setShowCreateTableModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Número de Mesa</Label>
                <Input
                  placeholder="ej: 1, A1, Terraza-1"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidad (personas)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Área (opcional)</Label>
                <Input
                  placeholder="ej: Terraza, Salón Principal, VIP"
                  value={newTableArea}
                  onChange={(e) => setNewTableArea(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateTableModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTable}>
                Crear Mesa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Selector Modal */}
        <ProductSelectorModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setProductSelectorCallback(null);
          }}
          onSelect={handleProductSelect}
          products={products}
        />

        {/* Checkout Modal */}
        {selectedTableOrder && (
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={() => setShowCheckoutModal(false)}
            tableOrder={selectedTableOrder}
            table={selectedTable}
            onComplete={handleCheckoutComplete}
          />
        )}
      </FeatureGuard>
    </ProtectedRoute>
  );
}