import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { requireActiveSubscription } from "@/middleware/subscription";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
import { getCashRegisters, getActiveCashRegister, openCashRegister, closeCashRegister, getCashRegisterReport } from "@/services/cashRegisterService";
import { DollarSign, FileText, Calendar, User, AlertCircle, CheckCircle, XCircle, Plus, Clock, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireAuth } from "@/middleware/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { LayoutDashboard, Store, Users, ShoppingCart, Package, DollarSign, Search, Calendar, ChevronDown, Download, Eye, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { FeatureGuard } from "@/components/FeatureGuard";
import { cn } from "@/lib/utils";

export const getServerSideProps = requireActiveSubscription;

export default function CashRegisterPage() {
  return (
    <ProtectedRoute requiredPermission="cash_register">
      <CashRegisterContent />
    </ProtectedRoute>
  );
}

function CashRegisterContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [activeRegister, setActiveRegister] = useState<any | null>(null);
  const [registers, setRegisters] = useState<any[]>([]);
  const [filteredRegisters, setFilteredRegisters] = useState<any[]>([]);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [openForm, setOpenForm] = useState({
    openingAmount: "",
    notes: "",
  });
  const [closeForm, setCloseForm] = useState({
    closingAmount: "",
    notes: "",
  });
  const [shiftSales, setShiftSales] = useState<number>(0);
  const [expectedAmount, setExpectedAmount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh active register data every 30 seconds
  useEffect(() => {
    if (!businessId || !employeeId) return;

    const interval = setInterval(async () => {
      try {
        const employee = await businessService.getEmployeeByUserId(
          (await supabase.auth.getUser()).data.user!.id
        );
        
        if (!employee) return;

        // Reload active register for owners/admins or current employee
        let active;
        if (employee.role === "owner" || employee.role === "admin") {
          const registersData = await getCashRegisters(businessId);
          active = registersData.find(r => r.status === "open");
        } else {
          active = await getActiveCashRegister(businessId, employee.id);
        }
        
        setActiveRegister(active);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [businessId, employeeId]);

  useEffect(() => {
    filterRegisters();
  }, [filterStatus, registers]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const business = await businessService.getBusinessByOwnerId(user.id);
      if (!business) {
        router.push("/");
        return;
      }

      setBusinessId(business.id);

      const employee = await businessService.getEmployeeByUserId(user.id);
      if (!employee) {
        toast({
          title: "Error",
          description: "Employee profile not found",
          variant: "destructive",
        });
        return;
      }

      setEmployeeId(employee.id);

      // Get all registers for the business
      const registersData = await getCashRegisters(business.id);
      setRegisters(registersData);
      setFilteredRegisters(registersData);

      // For owners/admins: show ANY active register
      // For cashiers: show only THEIR active register
      let active;
      if (employee.role === "owner" || employee.role === "admin") {
        // Find any open register in the business
        active = registersData.find(r => r.status === "open");
      } else {
        // Find only their own open register
        active = await getActiveCashRegister(business.id, employee.id);
      }
      
      setActiveRegister(active);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load cash register data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function filterRegisters() {
    if (filterStatus === "all") {
      setFilteredRegisters(registers);
      return;
    }

    const filtered = registers.filter((reg) => reg.status === filterStatus);
    setFilteredRegisters(filtered);
  }

  async function handleOpenCashRegister() {
    if (!businessId || !employeeId) return;

    try {
      await openCashRegister({
        businessId,
        employeeId, // Opens register for the current logged-in user
        openingAmount: parseFloat(openForm.openingAmount),
        notes: openForm.notes || undefined,
      });

      toast({
        title: "Cash register opened",
        description: "Your shift has started successfully.",
      });

      setOpenDialogOpen(false);
      setOpenForm({ openingAmount: "", notes: "" });
      await loadData();
    } catch (error: any) {
      console.error("Error opening cash register:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open cash register",
        variant: "destructive",
      });
    }
  }

  async function handleCloseCashRegister() {
    if (!activeRegister) return;

    try {
      await closeCashRegister({
        registerId: activeRegister.id,
        closingAmount: parseFloat(closeForm.closingAmount),
        notes: closeForm.notes || undefined,
      });

      toast({
        title: "Cash register closed",
        description: "Your shift has been closed successfully.",
      });

      setCloseDialogOpen(false);
      setCloseForm({ closingAmount: "", notes: "" });
      setShiftSales(0);
      setExpectedAmount(0);
      await loadData();
    } catch (error) {
      console.error("Error closing cash register:", error);
      toast({
        title: "Error",
        description: "Failed to close cash register",
        variant: "destructive",
      });
    }
  }

  async function loadShiftSales() {
    if (!activeRegister) return;

    try {
      // Get all sales for this cash register
      const { data, error } = await supabase
        .from("sales")
        .select("total")
        .eq("cash_register_id", activeRegister.id);

      if (error) {
        console.error("Error loading shift sales:", error);
        return;
      }

      const total = (data || []).reduce((sum, sale) => sum + Number(sale.total), 0);
      setShiftSales(total);
      setExpectedAmount(Number(activeRegister.opening_amount) + total);
    } catch (error) {
      console.error("Error calculating shift sales:", error);
    }
  }

  useEffect(() => {
    if (closeDialogOpen && activeRegister) {
      loadShiftSales();
    }
  }, [closeDialogOpen, activeRegister]);

  // Calculate shift sales whenever active register changes
  useEffect(() => {
    if (activeRegister) {
      loadShiftSales();
    } else {
      setShiftSales(0);
      setExpectedAmount(0);
    }
  }, [activeRegister]);

  async function handleViewReport(register: any) {
    try {
      const report = await getCashRegisterReport(register.id);
      setSelectedReport(report);
      setReportDialogOpen(true);
    } catch (error) {
      console.error("Error loading report:", error);
      toast({
        title: "Error",
        description: "Failed to load cash register report",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading cash register...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cash Register - POS System</title>
      </Head>

      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <DollarSign className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Corte de Caja</CardTitle>
                    <CardDescription>
                      Gestiona las aperturas y cierres de caja
                    </CardDescription>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Active Register Card */}
                  {activeRegister ? (
                    <Card className="border-accent">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                              <DollarSign className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">Turno Activo</CardTitle>
                              <CardDescription>
                                {activeRegister.employees?.profiles?.full_name || activeRegister.employees?.profiles?.email || "Usuario"} • 
                                Iniciado: {new Date(activeRegister.opened_at).toLocaleString()}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-accent text-accent-foreground">
                            Abierto
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Apertura</p>
                            <p className="text-2xl font-bold text-foreground">
                              ${Number(activeRegister.opening_amount).toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Ventas del Turno</p>
                            <p className="text-2xl font-bold text-accent">
                              ${shiftSales.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Total Esperado</p>
                            <p className="text-2xl font-bold text-foreground">
                              ${expectedAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {activeRegister.notes && (
                          <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground mb-1">Notas de apertura:</p>
                            <p className="text-sm">{activeRegister.notes}</p>
                          </div>
                        )}
                        <Button
                          onClick={() => setCloseDialogOpen(true)}
                          className="w-full"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cerrar Turno
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay turno activo</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          Abre un nuevo turno para comenzar a registrar ventas
                        </p>
                        <Button onClick={() => setOpenDialogOpen(true)} size="lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Abrir Turno
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="open">Abiertos</SelectItem>
                        <SelectItem value="closed">Cerrados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* History Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Turnos</CardTitle>
                      <CardDescription>
                        Registro de aperturas y cierres anteriores
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredRegisters.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha Apertura</TableHead>
                                <TableHead className="hidden md:table-cell">Monto Inicial</TableHead>
                                <TableHead className="hidden lg:table-cell">Monto Final</TableHead>
                                <TableHead className="hidden lg:table-cell">Diferencia</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredRegisters.map((register) => {
                                const diff = register.closing_amount
                                  ? Number(register.closing_amount) - Number(register.opening_amount)
                                  : 0;
                                return (
                                  <TableRow key={register.id}>
                                    <TableCell>
                                      {new Date(register.opened_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                      ${Number(register.opening_amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                      {register.closing_amount
                                        ? `$${Number(register.closing_amount).toFixed(2)}`
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                      {register.closing_amount ? (
                                        <span
                                          className={
                                            diff > 0
                                              ? "text-accent"
                                              : diff < 0
                                              ? "text-destructive"
                                              : ""
                                          }
                                        >
                                          ${diff.toFixed(2)}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          register.status === "open" ? "default" : "secondary"
                                        }
                                      >
                                        {register.status === "open" ? "Abierto" : "Cerrado"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedReport(register);
                                          setReportDialogOpen(true);
                                        }}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                          <p className="text-muted-foreground">
                            No hay registros de turnos
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Open Cash Register</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="openingAmount">Opening Amount *</Label>
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                value={openForm.openingAmount}
                onChange={(e) => setOpenForm({ ...openForm, openingAmount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openNotes">Notes (Optional)</Label>
              <Textarea
                id="openNotes"
                value={openForm.notes}
                onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
                placeholder="Any notes about this shift..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenCashRegister} disabled={!openForm.openingAmount}>
              Open Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Close Cash Register</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary of shift */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Opening Amount</span>
                  <span className="text-lg font-semibold">
                    ${Number(activeRegister?.opening_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Sales This Shift</span>
                  <span className="text-lg font-semibold text-accent">
                    +${shiftSales.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-base font-semibold">Expected Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    ${expectedAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="closingAmount">Closing Amount (Cash Counted) *</Label>
              <Input
                id="closingAmount"
                type="number"
                step="0.01"
                value={closeForm.closingAmount}
                onChange={(e) => setCloseForm({ ...closeForm, closingAmount: e.target.value })}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Count all the cash in the register and enter the total amount
              </p>
            </div>

            {/* Show difference in real-time */}
            {closeForm.closingAmount && (
              <Card className={`border-2 ${
                parseFloat(closeForm.closingAmount) === expectedAmount
                  ? "border-accent bg-accent/5"
                  : parseFloat(closeForm.closingAmount) > expectedAmount
                  ? "border-blue-500 bg-blue-50"
                  : "border-destructive bg-destructive/5"
              }`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Difference</span>
                    <span className={`text-2xl font-bold ${
                      parseFloat(closeForm.closingAmount) === expectedAmount
                        ? "text-accent"
                        : parseFloat(closeForm.closingAmount) > expectedAmount
                        ? "text-blue-600"
                        : "text-destructive"
                    }`}>
                      {parseFloat(closeForm.closingAmount) > expectedAmount ? "+" : ""}
                      ${(parseFloat(closeForm.closingAmount) - expectedAmount).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {parseFloat(closeForm.closingAmount) === expectedAmount
                      ? "✓ Perfect! No difference"
                      : parseFloat(closeForm.closingAmount) > expectedAmount
                      ? "↑ Surplus - More cash than expected"
                      : "↓ Shortage - Less cash than expected"}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="closeNotes">Notes (Optional)</Label>
              <Textarea
                id="closeNotes"
                value={closeForm.notes}
                onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                placeholder="Any notes about this closing..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseCashRegister} disabled={!closeForm.closingAmount} variant="destructive">
              Close Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Turno</DialogTitle>
            <DialogDescription>
              {selectedReport && format(new Date(selectedReport.opened_at), "PPpp", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      Total Ventas
                    </div>
                    <div className="text-2xl font-bold">
                      ${Number(selectedReport.total_sales || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">
                      Efectivo en Caja
                    </div>
                    <div className="text-2xl font-bold">
                      ${Number(selectedReport.cash_in_drawer || 0).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Apertura</Label>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedReport.opened_at), "PPpp", { locale: es })}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Monto Inicial</Label>
                    <p className="text-sm font-medium">
                      ${Number(selectedReport.opening_amount || 0).toFixed(2)}
                    </p>
                  </div>

                  {selectedReport.status === "closed" && selectedReport.closing_amount !== null && (
                    <div>
                      <Label className="text-muted-foreground">Monto de Cierre</Label>
                      <p className="text-sm font-medium">
                        ${Number(selectedReport.closing_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedReport.closed_at && (
                    <div>
                      <Label className="text-muted-foreground">Cierre</Label>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedReport.closed_at), "PPpp", { locale: es })}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground">Empleado</Label>
                    <p className="text-sm font-medium">
                      {selectedReport.employees?.full_name || "N/A"}
                    </p>
                  </div>

                  {selectedReport.status === "closed" && selectedReport.difference !== null && (
                    <div>
                      <Label className="text-muted-foreground">Diferencia</Label>
                      <p className={cn(
                        "text-sm font-medium",
                        Number(selectedReport.difference) > 0 && "text-green-600",
                        Number(selectedReport.difference) < 0 && "text-red-600"
                      )}>
                        ${Number(selectedReport.difference || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedReport.notes && (
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                    {selectedReport.notes}
                  </p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Label className="text-muted-foreground">Estado</Label>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  selectedReport.status === "open" && "bg-green-100 text-green-800",
                  selectedReport.status === "closed" && "bg-gray-100 text-gray-800"
                )}>
                  {selectedReport.status === "open" ? "Abierto" : "Cerrado"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}