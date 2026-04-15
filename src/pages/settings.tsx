import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { settingsService, type BusinessSettings } from "@/services/settingsService";
import { employeeService } from "@/services/employeeService";
import { paymentMethodService } from "@/services/paymentMethodService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Building2, Receipt, Users, CreditCard, Palette, Save, Trash2, Plus, Mail } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { EmployeeWithUser } from "@/services/employeeService";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";
import { subscriptionService } from "@/services/subscriptionService";

type Employee = Database["public"]["Tables"]["employees"]["Row"] & {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export default function Settings() {
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Form states
  const [businessForm, setBusinessForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: ""
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [taxForm, setTaxForm] = useState({
    tax_rate: 0,
    tax_included: false
  });
  
  const [customizationForm, setCustomizationForm] = useState({
    pos_name: "",
    primary_color: "",
    secondary_color: "",
    accent_color: ""
  });
  
  const [printerWidth, setPrinterWidth] = useState<"58mm" | "80mm">("80mm");
  
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState<"admin" | "cashier">("cashier");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const biz = await businessService.getCurrentBusiness();
      if (!biz) {
        toast({
          title: "Error",
          description: "No se encontró el negocio",
          variant: "destructive"
        });
        return;
      }

      setBusinessId(biz.id);
      
      const [bizSettings, empData, pmData] = await Promise.all([
        settingsService.getBusinessSettings(biz.id),
        employeeService.getEmployees(biz.id),
        paymentMethodService.getPaymentMethods(biz.id)
      ]);

      setSettings(bizSettings);
      setBusinessForm({
        name: bizSettings.name,
        address: bizSettings.address || "",
        phone: bizSettings.phone || "",
        email: bizSettings.email || ""
      });
      setLogoPreview(bizSettings.logo_url || "");
      setTaxForm({
        tax_rate: bizSettings.tax_rate,
        tax_included: bizSettings.tax_included
      });
      setCustomizationForm({
        pos_name: bizSettings.pos_name,
        primary_color: bizSettings.primary_color,
        secondary_color: bizSettings.secondary_color,
        accent_color: bizSettings.accent_color
      });
      setPrinterWidth((bizSettings.printer_width as "58mm" | "80mm") || "80mm");
      setEmployees(empData);
      setPaymentMethods(pmData);
      
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(file: File) {
    if (!businessId) return null;

    setUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (logoPreview) {
        const oldPath = logoPreview.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('business-logos')
            .remove([`${businessId}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${businessId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Error al subir el logo",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSaveBusinessInfo() {
    if (!businessId) return;
    
    setSaving(true);
    try {
      let logoUrl = logoPreview;

      // Upload logo if a new file was selected
      if (logoFile) {
        const uploadedUrl = await handleLogoUpload(logoFile);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      // Update business info including logo
      const { error } = await supabase
        .from('businesses')
        .update({
          name: businessForm.name,
          address: businessForm.address || null,
          phone: businessForm.phone || null,
          email: businessForm.email || null,
          logo_url: logoUrl || null
        })
        .eq('id', businessId);

      if (error) throw error;

      setLogoPreview(logoUrl);
      setLogoFile(null);
      
      toast({
        title: "Guardado",
        description: "Información del negocio actualizada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTaxSettings() {
    if (!businessId) return;
    
    setSaving(true);
    try {
      await settingsService.updateTaxSettings(businessId, taxForm);
      toast({
        title: "Guardado",
        description: "Configuración de impuestos actualizada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCustomization() {
    if (!businessId) return;
    
    setSaving(true);
    try {
      await settingsService.updateCustomization(businessId, customizationForm);
      
      // Aplicar colores inmediatamente
      applyColors();
      
      toast({
        title: "Guardado",
        description: "Personalización actualizada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrinterConfig() {
    if (!businessId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ printer_width: printerWidth })
        .eq("id", businessId);

      if (error) throw error;

      toast({
        title: "Guardado",
        description: "Configuración de impresora actualizada"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar configuración",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  function applyColors() {
    const root = document.documentElement;
    
    // Convertir hex a HSL (simplificado)
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "0 0% 0%";
      
      const r = parseInt(result[1], 16) / 255;
      const g = parseInt(result[2], 16) / 255;
      const b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    root.style.setProperty("--primary", hexToHSL(customizationForm.primary_color));
    root.style.setProperty("--secondary", hexToHSL(customizationForm.secondary_color));
    root.style.setProperty("--accent", hexToHSL(customizationForm.accent_color));
  }

  async function handleInviteEmployee() {
    if (!businessId || !newEmployeeEmail) return;
    
    try {
      await employeeService.inviteEmployee(businessId, newEmployeeEmail, newEmployeeRole);
      toast({
        title: "Empleado agregado",
        description: `${newEmployeeEmail} fue agregado como ${newEmployeeRole}`
      });
      
      setNewEmployeeEmail("");
      setNewEmployeeRole("cashier");
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al agregar empleado",
        variant: "destructive"
      });
    }
  }

  async function handleToggleEmployee(id: string, isActive: boolean) {
    try {
      await employeeService.updateEmployee(id, { is_active: !isActive });
      loadData();
      toast({
        title: isActive ? "Empleado desactivado" : "Empleado activado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar empleado",
        variant: "destructive"
      });
    }
  }

  async function handleDeleteEmployee(id: string) {
    if (!confirm("¿Eliminar este empleado?")) return;
    
    try {
      await employeeService.deleteEmployee(id);
      loadData();
      toast({
        title: "Empleado eliminado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar empleado",
        variant: "destructive"
      });
    }
  }

  async function handleAddPaymentMethod() {
    if (!businessId || !newPaymentMethod) return;
    
    try {
      await paymentMethodService.createPaymentMethod(businessId, {
        name: newPaymentMethod,
        is_active: true
      });
      
      setNewPaymentMethod("");
      loadData();
      toast({
        title: "Método de pago agregado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al agregar método de pago",
        variant: "destructive"
      });
    }
  }

  async function handleTogglePaymentMethod(id: string, isActive: boolean) {
    try {
      await paymentMethodService.updatePaymentMethod(id, { is_active: !isActive });
      loadData();
      toast({
        title: isActive ? "Método desactivado" : "Método activado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar método de pago",
        variant: "destructive"
      });
    }
  }

  async function handleDeletePaymentMethod(id: string) {
    if (!confirm("¿Eliminar este método de pago?")) return;
    
    try {
      await paymentMethodService.deletePaymentMethod(id);
      loadData();
      toast({
        title: "Método de pago eliminado"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar método de pago",
        variant: "destructive"
      });
    }
  }

  async function handleAddEmployee() {
    // Check employee limit
    const result = await subscriptionService.canAddEmployee();
    
    if (!result.canAdd) {
      toast({
        title: "Límite alcanzado",
        description: result.reason,
        variant: "destructive",
      });
      
      // Show upgrade prompt
      setTimeout(() => {
        router.push("/subscription");
      }, 2000);
      return;
    }

    setEditingEmployee(null);
    setEmployeeDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
              <p className="text-muted-foreground">
                Gestiona la configuración de tu negocio
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="business">Negocio</TabsTrigger>
                <TabsTrigger value="employees">Empleados</TabsTrigger>
                <TabsTrigger value="payments">Métodos de Pago</TabsTrigger>
                <TabsTrigger value="system">Sistema</TabsTrigger>
              </TabsList>

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
                    <CardDescription>Administra los empleados y sus roles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Email del empleado"
                        value={newEmployeeEmail}
                        onChange={(e) => setNewEmployeeEmail(e.target.value)}
                        type="email"
                      />
                      <Select value={newEmployeeRole} onValueChange={(value: "admin" | "cashier") => setNewEmployeeRole(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="cashier">Cajero</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleInviteEmployee}>
                        <Mail className="mr-2 h-4 w-4" />
                        Invitar
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
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}