import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { settingsService, type BusinessSettings } from "@/services/settingsService";
import { employeeService } from "@/services/employeeService";
import { paymentMethodService, type PaymentMethod } from "@/services/paymentMethodService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { PermissionSelector } from "@/components/PermissionSelector";
import { Building2, Receipt, Users, CreditCard, Palette, Save, Trash2, Plus, Mail, Settings as SettingsIcon } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { EmployeeWithUser, EmployeePermission } from "@/services/employeeService";
import type { Business } from "@/services/businessService";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";
import { subscriptionService } from "@/services/subscriptionService";

export const getServerSideProps = requireActiveSubscription;

export default function Settings() {
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Restore form state
  const [businessForm, setBusinessForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxForm, setTaxForm] = useState({ tax_rate: 16, tax_included: false });
  const [printerWidth, setPrinterWidth] = useState<"58mm" | "80mm">("80mm");
  const [customizationForm, setCustomizationForm] = useState({ pos_name: "Mi POS", primary_color: "#2A1810", secondary_color: "#4A3228", accent_color: "#4A9C64" });
  
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeePassword, setNewEmployeePassword] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState<"admin" | "cashier">("cashier");
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<EmployeePermission[]>([]);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const currentBusiness = await businessService.getCurrentBusiness();
      if (!currentBusiness) {
        router.push("/");
        return;
      }

      // Check if user is owner
      const userIsOwner = currentBusiness.owner_id === user.id;
      setIsOwner(userIsOwner);

      if (!userIsOwner) {
        // Employees cannot access settings
        toast({
          title: "Acceso Denegado",
          description: "Solo el propietario del negocio puede acceder a Configuración.",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }

      setBusiness(currentBusiness);
      setBusinessId(currentBusiness.id);
      setBusinessForm({
        name: currentBusiness.name || "",
        email: currentBusiness.email || "",
        phone: currentBusiness.phone || "",
        address: currentBusiness.address || "",
      });
      setLogoPreview(currentBusiness.logo_url || "");
      setTaxForm({
        tax_rate: currentBusiness.tax_rate || 16,
        tax_included: currentBusiness.tax_included || false,
      });
      setPrinterWidth((currentBusiness.printer_width as "58mm" | "80mm") || "80mm");
      setCustomizationForm({
        pos_name: currentBusiness.pos_name || "Mi POS",
        primary_color: currentBusiness.primary_color || "#2A1810",
        secondary_color: currentBusiness.secondary_color || "#4A3228",
        accent_color: currentBusiness.accent_color || "#4A9C64",
      });

      // Load employees and payment methods
      await loadEmployees(currentBusiness.id);
      await loadPaymentMethods(currentBusiness.id);
    } catch (error) {
      console.error("Error checking access:", error);
      toast({
        title: "Error",
        description: "No se pudo verificar el acceso. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees(businessId: string) {
    try {
      const employeesData = await employeeService.getEmployees(businessId);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados.",
        variant: "destructive",
      });
    }
  }

  async function loadPaymentMethods(businessId: string) {
    try {
      const methodsData = await paymentMethodService.getPaymentMethods(businessId);
      setPaymentMethods(methodsData);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los métodos de pago.",
        variant: "destructive",
      });
    }
  }

  async function handleCreateEmployee() {
    if (!businessId || !newEmployeeEmail || !newEmployeePassword || !newEmployeeName) return;

    setCreatingEmployee(true);
    try {
      const result = await employeeService.createEmployeeAccount({
        email: newEmployeeEmail,
        password: newEmployeePassword,
        full_name: newEmployeeName,
        business_id: businessId,
        role: newEmployeeRole,
      });

      if (!result.success) {
        throw new Error(result.error || "Error al crear empleado");
      }

      toast({
        title: "Empleado Creado",
        description: `${newEmployeeName} ha sido agregado al equipo.`,
      });

      // Reset form
      setNewEmployeeName("");
      setNewEmployeeEmail("");
      setNewEmployeePassword("");
      setNewEmployeeRole("cashier");

      // Reload employees
      await loadEmployees(businessId);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el empleado.",
        variant: "destructive",
      });
    } finally {
      setCreatingEmployee(false);
    }
  }

  async function handleEditEmployeePermissions(emp: any) {
    try {
      const permissions = await employeeService.getEmployeePermissions(emp.id);
      setEditingEmployee(emp);
      setEditingPermissions(permissions);
      setEmployeeDialogOpen(true);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos.",
        variant: "destructive",
      });
    }
  }

  async function handleToggleEmployee(id: string, currentActive: boolean) {
    try {
      await employeeService.updateEmployee(id, { is_active: !currentActive });
      
      toast({
        title: currentActive ? "Empleado Desactivado" : "Empleado Activado",
        description: "El estado del empleado se actualizó correctamente.",
      });

      if (businessId) {
        await loadEmployees(businessId);
      }
    } catch (error) {
      console.error("Error toggling employee:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del empleado.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteEmployee(id: string) {
    if (!confirm("¿Estás seguro de eliminar este empleado? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await employeeService.deleteEmployee(id);
      
      toast({
        title: "Empleado Eliminado",
        description: "El empleado ha sido eliminado del sistema.",
      });

      if (businessId) {
        await loadEmployees(businessId);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveEmployeePermissions() {
    if (!editingEmployee) return;

    setSaving(true);
    try {
      await employeeService.updateEmployeePermissions(editingEmployee.id, editingPermissions);
      
      toast({
        title: "Permisos Actualizados",
        description: "Los permisos del empleado se guardaron correctamente.",
      });

      setEmployeeDialogOpen(false);
      setEditingEmployee(null);
      setEditingPermissions([]);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los permisos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPaymentMethod() {
    if (!businessId || !newPaymentMethod.trim()) return;

    try {
      await paymentMethodService.createPaymentMethod(businessId, {
        name: newPaymentMethod.trim(),
        is_active: true,
      });

      toast({
        title: "Método Agregado",
        description: `${newPaymentMethod} se agregó a los métodos de pago.`,
      });

      setNewPaymentMethod("");
      await loadPaymentMethods(businessId);
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el método de pago.",
        variant: "destructive",
      });
    }
  }

  async function handleTogglePaymentMethod(id: string, currentActive: boolean) {
    try {
      await paymentMethodService.updatePaymentMethod(id, { is_active: !currentActive });
      
      toast({
        title: currentActive ? "Método Desactivado" : "Método Activado",
        description: "El estado del método de pago se actualizó.",
      });

      if (businessId) {
        await loadPaymentMethods(businessId);
      }
    } catch (error) {
      console.error("Error toggling payment method:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el método de pago.",
        variant: "destructive",
      });
    }
  }

  async function handleDeletePaymentMethod(id: string) {
    if (!confirm("¿Eliminar este método de pago?")) return;

    try {
      await paymentMethodService.deletePaymentMethod(id);
      
      toast({
        title: "Método Eliminado",
        description: "El método de pago fue eliminado.",
      });

      if (businessId) {
        await loadPaymentMethods(businessId);
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el método de pago.",
        variant: "destructive",
      });
    }
  }

  async function handleSaveBusinessInfo() {
    if (!businessId || !businessForm.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del negocio es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Upload logo if there's a new file
      let logoUrl = logoPreview;
      if (logoFile) {
        setUploadingLogo(true);
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${businessId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("business-logos")
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
        setUploadingLogo(false);
      }

      await businessService.updateBusiness(businessId, {
        name: businessForm.name,
        email: businessForm.email || null,
        phone: businessForm.phone || null,
        address: businessForm.address || null,
        logo_url: logoUrl || null,
      });

      toast({
        title: "Información Guardada",
        description: "Los datos del negocio se actualizaron correctamente.",
      });

      // Reload business data
      const updatedBusiness = await businessService.getCurrentBusiness();
      if (updatedBusiness) {
        setBusiness(updatedBusiness);
      }
    } catch (error) {
      console.error("Error saving business info:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadingLogo(false);
    }
  }

  async function handleSaveTaxSettings() {
    if (!businessId) return;

    setSaving(true);
    try {
      await businessService.updateBusiness(businessId, {
        tax_rate: taxForm.tax_rate,
        tax_included: taxForm.tax_included,
      });

      toast({
        title: "Configuración Guardada",
        description: "Los ajustes de impuestos se actualizaron.",
      });
    } catch (error) {
      console.error("Error saving tax settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de impuestos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrinterConfig() {
    if (!businessId) return;

    setSaving(true);
    try {
      await businessService.updateBusiness(businessId, {
        printer_width: printerWidth,
      });

      toast({
        title: "Configuración Guardada",
        description: "El ancho de impresora se actualizó correctamente.",
      });
    } catch (error) {
      console.error("Error saving printer config:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de impresora.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCustomization() {
    if (!businessId) return;

    setSaving(true);
    try {
      await businessService.updateBusiness(businessId, {
        pos_name: customizationForm.pos_name,
        primary_color: customizationForm.primary_color,
        secondary_color: customizationForm.secondary_color,
        accent_color: customizationForm.accent_color,
      });

      toast({
        title: "Personalización Guardada",
        description: "Los colores y nombre del POS se actualizaron. Recarga la página para ver los cambios.",
      });
    } catch (error) {
      console.error("Error saving customization:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la personalización.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SEO 
        title="Configuración - Nexum Cloud"
        description="Configuración de Nexum Cloud"
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Configuración</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Gestiona la configuración de tu negocio
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  <TabsTrigger value="business">Negocio</TabsTrigger>
                  <TabsTrigger value="employees">Empleados</TabsTrigger>
                  <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
                  <TabsTrigger value="system">Sistema</TabsTrigger>
                </TabsList>

                {/* Business Settings Tab */}
                <TabsContent value="business">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información del Negocio</CardTitle>
                      <CardDescription>Datos generales de tu negocio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Negocio *</Label>
                          <Input
                            id="name"
                            value={businessForm.name}
                            onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                            placeholder="Mi Cafetería"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={businessForm.email}
                            onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                            placeholder="contacto@micafeteria.com"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input
                            id="phone"
                            value={businessForm.phone}
                            onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                            placeholder="+52 123 456 7890"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address">Dirección</Label>
                          <Input
                            id="address"
                            value={businessForm.address}
                            onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                            placeholder="Calle Principal #123"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="logo">Logo del Negocio</Label>
                          <div className="flex items-start gap-4">
                            {logoPreview && (
                              <div className="flex-shrink-0">
                                <img
                                  src={logoPreview}
                                  alt="Logo actual"
                                  className="h-24 w-24 object-contain border rounded-lg bg-muted p-2"
                                />
                              </div>
                            )}
                            <div className="flex-1 space-y-2">
                              <Input
                                id="logo"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setLogoFile(file);
                                    // Create preview
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setLogoPreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                disabled={uploadingLogo}
                              />
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG o WebP. Máximo 2MB. Se mostrará en los tickets de venta.
                              </p>
                              {logoPreview && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setLogoPreview("");
                                    setLogoFile(null);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Quitar Logo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={handleSaveBusinessInfo} disabled={saving || uploadingLogo}>
                          <Save className="mr-2 h-4 w-4" />
                          {uploadingLogo ? "Subiendo logo..." : saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="taxes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración de Impuestos</CardTitle>
                      <CardDescription>Configura el IVA y otros impuestos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="tax_rate">Tasa de IVA (%)</Label>
                        <Input
                          id="tax_rate"
                          type="number"
                          step="0.01"
                          value={taxForm.tax_rate}
                          onChange={(e) => setTaxForm({ ...taxForm, tax_rate: parseFloat(e.target.value) || 0 })}
                          placeholder="16.00"
                        />
                        <p className="text-sm text-muted-foreground">Ejemplo: 16 para 16%</p>
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                          <Label htmlFor="tax_included">IVA Incluido en Precios</Label>
                          <p className="text-sm text-muted-foreground">
                            Si está activado, los precios ya incluyen el IVA
                          </p>
                        </div>
                        <Switch
                          id="tax_included"
                          checked={taxForm.tax_included}
                          onCheckedChange={(checked) => setTaxForm({ ...taxForm, tax_included: checked })}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={handleSaveTaxSettings} disabled={saving}>
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="employees">
                  <Card>
                    <CardHeader>
                      <CardTitle>Gestión de Empleados</CardTitle>
                      <CardDescription>Crea cuentas para tus cajeros o administradores. Ellos iniciarán sesión directamente con estos datos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-muted/50 p-4 rounded-lg border">
                        <div className="space-y-2">
                          <Label>Nombre del empleado</Label>
                          <Input
                            placeholder="Ej. Juan Pérez"
                            value={newEmployeeName}
                            onChange={(e) => setNewEmployeeName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email (Usuario)</Label>
                          <Input
                            placeholder="juan@ejemplo.com"
                            value={newEmployeeEmail}
                            onChange={(e) => setNewEmployeeEmail(e.target.value)}
                            type="email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contraseña</Label>
                          <Input
                            placeholder="Mínimo 6 caracteres"
                            value={newEmployeePassword}
                            onChange={(e) => setNewEmployeePassword(e.target.value)}
                            type="password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rol</Label>
                          <Select value={newEmployeeRole} onValueChange={(value: "admin" | "cashier") => setNewEmployeeRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="cashier">Cajero</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={handleCreateEmployee} 
                          disabled={creatingEmployee || !newEmployeeEmail || !newEmployeePassword || !newEmployeeName}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {creatingEmployee ? "Creando..." : "Crear Empleado"}
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empleado</TableHead>
                              <TableHead>Rol</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employees.map((emp) => (
                              <TableRow key={emp.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{emp.user?.full_name || "Sin nombre"}</p>
                                    <p className="text-sm text-muted-foreground">{emp.user?.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={emp.role === "owner" ? "default" : emp.role === "admin" ? "secondary" : "outline"}>
                                    {emp.role === "owner" ? "Propietario" : emp.role === "admin" ? "Administrador" : "Cajero"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={emp.is_active ? "default" : "secondary"}>
                                    {emp.is_active ? "Activo" : "Inactivo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {emp.role !== "owner" && (
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditEmployeePermissions(emp)}
                                      >
                                        <SettingsIcon className="h-4 w-4 mr-2" />
                                        Permisos
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleEmployee(emp.id, emp.is_active || false)}
                                      >
                                        {emp.is_active ? "Desactivar" : "Activar"}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteEmployee(emp.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments">
                  <Card>
                    <CardHeader>
                      <CardTitle>Métodos de Pago</CardTitle>
                      <CardDescription>Configura los métodos de pago disponibles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-4">
                        <Input
                          placeholder="Nombre del método (ej. Efectivo, Tarjeta)"
                          value={newPaymentMethod}
                          onChange={(e) => setNewPaymentMethod(e.target.value)}
                        />
                        <Button onClick={handleAddPaymentMethod}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Método</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentMethods.map((pm) => (
                              <TableRow key={pm.id}>
                                <TableCell className="font-medium">{pm.name}</TableCell>
                                <TableCell>
                                  <Badge variant={pm.is_active ? "default" : "secondary"}>
                                    {pm.is_active ? "Activo" : "Inactivo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTogglePaymentMethod(pm.id, pm.is_active || false)}
                                    >
                                      {pm.is_active ? "Desactivar" : "Activar"}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeletePaymentMethod(pm.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="printer">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuración de Impresora</CardTitle>
                      <CardDescription>Configura tu impresora térmica de tickets</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="printer_width">Ancho de Papel de Impresora</Label>
                        <Select value={printerWidth} onValueChange={(value: "58mm" | "80mm") => setPrinterWidth(value)}>
                          <SelectTrigger id="printer_width">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="58mm">58mm (2 pulgadas) - Compacta</SelectItem>
                            <SelectItem value="80mm">80mm (3 pulgadas) - Estándar</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Selecciona el ancho de papel de tu impresora térmica. 
                          El formato del ticket se ajustará automáticamente.
                        </p>
                      </div>

                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h4 className="font-medium mb-2">Vista Previa del Ticket</h4>
                        <div 
                          className="bg-white border-2 border-dashed border-border mx-auto p-4 font-mono text-xs"
                          style={{ width: printerWidth === "58mm" ? "200px" : "280px" }}
                        >
                          <div className="text-center mb-2">
                            <p className="font-bold">Mi Negocio</p>
                            <p className="text-[10px]">Calle Principal #123</p>
                            <p className="text-[10px]">Tel: 123-456-7890</p>
                          </div>
                          <div className="border-t border-dashed border-gray-400 my-2"></div>
                          <div className="space-y-1 text-[10px]">
                            <div className="flex justify-between">
                              <span>Ticket: #ABC12345</span>
                              <span>Fecha: 14/04/2026 12:30</span>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-gray-400 my-2"></div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between font-semibold">
                                <span>1x Café Latte</span>
                                <span>$55.00</span>
                              </div>
                              <div className="text-[10px] text-gray-600 ml-2">$55.00 c/u</div>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-gray-400 my-2"></div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>$55.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span>IVA (16%)</span>
                              <span>$8.80</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm mt-1">
                              <span>TOTAL</span>
                              <span>$63.80</span>
                            </div>
                          </div>
                          <div className="border-t border-dashed border-gray-400 my-2"></div>
                          <div className="text-center text-[10px]">
                            <p>¡Gracias por su compra!</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Ancho: {printerWidth === "58mm" ? "~200px (58mm)" : "~280px (80mm)"}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleSavePrinterConfig} disabled={saving}>
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Guardando..." : "Guardar Configuración"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="customization">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personalización</CardTitle>
                      <CardDescription>Personaliza la apariencia del sistema</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="pos_name">Nombre del POS</Label>
                        <Input
                          id="pos_name"
                          value={customizationForm.pos_name}
                          onChange={(e) => setCustomizationForm({ ...customizationForm, pos_name: e.target.value })}
                          placeholder="Mi Sistema POS"
                        />
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="primary_color">Color Primario</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primary_color"
                              type="color"
                              value={customizationForm.primary_color}
                              onChange={(e) => setCustomizationForm({ ...customizationForm, primary_color: e.target.value })}
                              className="w-20 h-10"
                            />
                            <Input
                              value={customizationForm.primary_color}
                              onChange={(e) => setCustomizationForm({ ...customizationForm, primary_color: e.target.value })}
                              placeholder="#2A1810"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="secondary_color">Color Secundario</Label>
                          <div className="flex gap-2">
                            <Input
                              id="secondary_color"
                              type="color"
                              value={customizationForm.secondary_color}
                              onChange={(e) => setCustomizationForm({ ...customizationForm, secondary_color: e.target.value })}
                              className="w-20 h-10"
                            />
                            <Input
                              value={customizationForm.secondary_color}
                              onChange={(e) => setCustomizationForm({ ...customizationForm, secondary_color: e.target.value })}
                              placeholder="#4A3228"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="accent_color">Color de Acento</Label>
                          <div className="flex gap-2">
                            <Input
                              id="accent_color"
                              type="color"
                              value={customizationForm.accent_color}
                              onChange={(e) => setCustomizationForm({ ...customizationForm, accent_color: e.target.value })}
                              className="w-20 h-10"
                            />
                            <Input
                              value={customizationForm.accent_color}
                              onChange={(e) => setCustomizationForm({ ...customizationForm, accent_color: e.target.value })}
                              placeholder="#4A9C64"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium mb-2">Vista Previa</p>
                        <div className="flex gap-2">
                          <div
                            className="w-20 h-20 rounded-lg border-2"
                            style={{ backgroundColor: customizationForm.primary_color }}
                          />
                          <div
                            className="w-20 h-20 rounded-lg border-2"
                            style={{ backgroundColor: customizationForm.secondary_color }}
                          />
                          <div
                            className="w-20 h-20 rounded-lg border-2"
                            style={{ backgroundColor: customizationForm.accent_color }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button onClick={handleSaveCustomization} disabled={saving}>
                          <Save className="mr-2 h-4 w-4" />
                          {saving ? "Guardando..." : "Guardar y Aplicar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="system">
                  <div className="space-y-6">
                    {/* Tax Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Configuración de Impuestos</CardTitle>
                        <CardDescription>Configura el IVA y otros impuestos</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="tax_rate">Tasa de IVA (%)</Label>
                          <Input
                            id="tax_rate"
                            type="number"
                            step="0.01"
                            value={taxForm.tax_rate}
                            onChange={(e) => setTaxForm({ ...taxForm, tax_rate: parseFloat(e.target.value) || 0 })}
                            placeholder="16.00"
                          />
                          <p className="text-sm text-muted-foreground">Ejemplo: 16 para 16%</p>
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2">
                          <div className="space-y-1">
                            <Label htmlFor="tax_included">IVA Incluido en Precios</Label>
                            <p className="text-sm text-muted-foreground">
                              Si está activado, los precios ya incluyen el IVA
                            </p>
                          </div>
                          <Switch
                            id="tax_included"
                            checked={taxForm.tax_included}
                            onCheckedChange={(checked) => setTaxForm({ ...taxForm, tax_included: checked })}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button onClick={handleSaveTaxSettings} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Guardando..." : "Guardar Configuración"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Printer Configuration */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Configuración de Impresora</CardTitle>
                        <CardDescription>Configura tu impresora térmica de tickets</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="printer_width">Ancho de Papel de Impresora</Label>
                          <Select value={printerWidth} onValueChange={(value: "58mm" | "80mm") => setPrinterWidth(value)}>
                            <SelectTrigger id="printer_width">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="58mm">58mm (2 pulgadas) - Compacta</SelectItem>
                              <SelectItem value="80mm">80mm (3 pulgadas) - Estándar</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground">
                            Selecciona el ancho de papel de tu impresora térmica. 
                            El formato del ticket se ajustará automáticamente.
                          </p>
                        </div>

                        <div className="border rounded-lg p-4 bg-muted/50">
                          <h4 className="font-medium mb-2">Vista Previa del Ticket</h4>
                          <div 
                            className="bg-white border-2 border-dashed border-border mx-auto p-4 font-mono text-xs"
                            style={{ width: printerWidth === "58mm" ? "200px" : "280px" }}
                          >
                            <div className="text-center mb-2">
                              <p className="font-bold">Mi Negocio</p>
                              <p className="text-[10px]">Calle Principal #123</p>
                              <p className="text-[10px]">Tel: 123-456-7890</p>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2"></div>
                            <div className="space-y-1 text-[10px]">
                              <div className="flex justify-between">
                                <span>Ticket: #ABC12345</span>
                                <span>Fecha: 16/04/2026 12:30</span>
                              </div>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2"></div>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between font-semibold">
                                  <span>1x Café Latte</span>
                                  <span>$55.00</span>
                                </div>
                                <div className="text-[10px] text-gray-600 ml-2">$55.00 c/u</div>
                              </div>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2"></div>
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>$55.00</span>
                              </div>
                              <div className="flex justify-between">
                                <span>IVA (16%)</span>
                                <span>$8.80</span>
                              </div>
                              <div className="flex justify-between font-bold text-sm mt-1">
                                <span>TOTAL</span>
                                <span>$63.80</span>
                              </div>
                            </div>
                            <div className="border-t border-dashed border-gray-400 my-2"></div>
                            <div className="text-center text-[10px]">
                              <p>¡Gracias por su compra!</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Ancho: {printerWidth === "58mm" ? "~200px (58mm)" : "~280px (80mm)"}
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={handleSavePrinterConfig} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Guardando..." : "Guardar Configuración"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customization */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Personalización</CardTitle>
                        <CardDescription>Personaliza la apariencia del sistema</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="pos_name">Nombre del POS</Label>
                          <Input
                            id="pos_name"
                            value={customizationForm.pos_name}
                            onChange={(e) => setCustomizationForm({ ...customizationForm, pos_name: e.target.value })}
                            placeholder="Mi Sistema POS"
                          />
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label htmlFor="primary_color">Color Primario</Label>
                            <div className="flex gap-2">
                              <Input
                                id="primary_color"
                                type="color"
                                value={customizationForm.primary_color}
                                onChange={(e) => setCustomizationForm({ ...customizationForm, primary_color: e.target.value })}
                                className="w-20 h-10"
                              />
                              <Input
                                value={customizationForm.primary_color}
                                onChange={(e) => setCustomizationForm({ ...customizationForm, primary_color: e.target.value })}
                                placeholder="#2A1810"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="secondary_color">Color Secundario</Label>
                            <div className="flex gap-2">
                              <Input
                                id="secondary_color"
                                type="color"
                                value={customizationForm.secondary_color}
                                onChange={(e) => setCustomizationForm({ ...customizationForm, secondary_color: e.target.value })}
                                className="w-20 h-10"
                              />
                              <Input
                                value={customizationForm.secondary_color}
                                onChange={(e) => setCustomizationForm({ ...customizationForm, secondary_color: e.target.value })}
                                placeholder="#4A3228"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="accent_color">Color de Acento</Label>
                            <div className="flex gap-2">
                              <Input
                                id="accent_color"
                                type="color"
                                value={customizationForm.accent_color}
                                onChange={(e) => setCustomizationForm({ ...customizationForm, accent_color: e.target.value })}
                                className="w-20 h-10"
                              />
                              <Input
                                value={customizationForm.accent_color}
                                onChange={(e) => setCustomizationForm({ ...customizationForm, accent_color: e.target.value })}
                                placeholder="#4A9C64"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-muted/50">
                          <p className="text-sm font-medium mb-2">Vista Previa</p>
                          <div className="flex gap-2">
                            <div
                              className="w-20 h-20 rounded-lg border-2"
                              style={{ backgroundColor: customizationForm.primary_color }}
                            />
                            <div
                              className="w-20 h-20 rounded-lg border-2"
                              style={{ backgroundColor: customizationForm.secondary_color }}
                            />
                            <div
                              className="w-20 h-20 rounded-lg border-2"
                              style={{ backgroundColor: customizationForm.accent_color }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button onClick={handleSaveCustomization} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Guardando..." : "Guardar y Aplicar"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>

      {/* Employee Permissions Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar Permisos" : "Nuevo Empleado"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee 
                ? `Configura los permisos de acceso para ${editingEmployee.user?.full_name || editingEmployee.user?.email}`
                : "Configura los permisos para el nuevo empleado"}
            </DialogDescription>
          </DialogHeader>

          {editingEmployee && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{editingEmployee.user?.full_name || "Sin nombre"}</p>
                    <p className="text-sm text-muted-foreground">{editingEmployee.user?.email}</p>
                  </div>
                  <Badge variant={editingEmployee.role === "admin" ? "default" : "outline"}>
                    {editingEmployee.role === "admin" ? "Administrador" : "Cajero"}
                  </Badge>
                </div>
              </div>

              <PermissionSelector
                permissions={editingPermissions}
                onChange={(perms: any) => setEditingPermissions(perms)}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEmployeeDialogOpen(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEmployeePermissions} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Permisos"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}