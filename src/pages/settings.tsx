import { SEO } from "@/components/SEO";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { employeeService, type EmployeeWithUser, type EmployeePermission } from "@/services/employeeService";
import { paymentMethodService } from "@/services/paymentMethodService";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionSelector } from "@/components/PermissionSelector";
import type { Tables } from "@/integrations/supabase/types";
import { Building2, DollarSign, CreditCard, Users, Settings as SettingsIcon, Save, Plus, Pencil, Trash2, Upload, X, Check, AlertCircle, Zap, ChevronRight, ArrowLeft, Palette, Printer
} from "lucide-react";
import type { Business } from "@/services/businessService";
import { requireActiveSubscription } from "@/middleware/subscription";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import { subscriptionService } from "@/services/subscriptionService";

export const getServerSideProps = requireActiveSubscription;

type SettingsView = "menu" | "business" | "employees" | "payments" | "taxes" | "printer" | "customization";

// Color palettes
const COLOR_PALETTES = [
  {
    id: "coffee",
    name: "Coffee House",
    description: "Cálido y acogedor, perfecto para cafeterías",
    primary: "#2A1810",
    secondary: "#4A3228",
    accent: "#4A9C64",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    description: "Profesional y confiable, ideal para negocios modernos",
    primary: "#0F4C81",
    secondary: "#1E3A5F",
    accent: "#00B4D8",
  },
  {
    id: "sunset",
    name: "Sunset Glow",
    description: "Energético y vibrante, perfecto para comida rápida",
    primary: "#D84315",
    secondary: "#BF360C",
    accent: "#FF6F00",
  },
  {
    id: "forest",
    name: "Forest Green",
    description: "Natural y fresco, ideal para negocios saludables",
    primary: "#2E7D32",
    secondary: "#1B5E20",
    accent: "#66BB6A",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<SettingsView>("menu");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [planName, setPlanName] = useState("");

  // Form states
  const [businessForm, setBusinessForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxForm, setTaxForm] = useState({ tax_rate: 16, tax_included: false });
  const [printerWidth, setPrinterWidth] = useState<"58mm" | "80mm">("80mm");
  const [customizationForm, setCustomizationForm] = useState({ pos_name: "Mi POS", primary_color: "#2A1810", secondary_color: "#4A3228", accent_color: "#4A9C64" });
  const [selectedPalette, setSelectedPalette] = useState<string>("coffee");
  
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

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"basic" | "professional" | "premium">("basic");
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    checkAccess();
  }, []);

  function handlePaletteSelect(paletteId: string) {
    const palette = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (palette) {
      setSelectedPalette(paletteId);
      setCustomizationForm({
        ...customizationForm,
        primary_color: palette.primary,
        secondary_color: palette.secondary,
        accent_color: palette.accent,
      });
    }
  }

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      setUserName(profile?.full_name || user.email?.split("@")[0] || "Usuario");

      const currentBusiness = await businessService.getCurrentBusiness();
      if (!currentBusiness) {
        router.push("/");
        return;
      }

      const userIsOwner = currentBusiness.owner_id === user.id;
      setIsOwner(userIsOwner);

      if (!userIsOwner) {
        toast({
          title: "Acceso Denegado",
          description: "Solo el propietario del negocio puede acceder a Configuración.",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setBusiness(currentBusiness);
      setBusinessId(currentBusiness.id);
      setBusinessName(currentBusiness.name);
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

      // Detectar paleta actual
      const currentPalette = COLOR_PALETTES.find(
        (p) =>
          p.primary === currentBusiness.primary_color &&
          p.secondary === currentBusiness.secondary_color &&
          p.accent === currentBusiness.accent_color
      );
      setSelectedPalette(currentPalette?.id || "custom");

      await loadEmployees(currentBusiness.id);
      await loadPaymentMethods(currentBusiness.id);

      const subscription = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("business_id", currentBusiness.id)
        .maybeSingle();

      if (subscription.data) {
        const planNames: Record<string, string> = {
          basic: "Plan Básico",
          professional: "Plan Profesional",
          premium: "Plan Premium",
        };
        setPlanName(planNames[subscription.data.plan] || "Plan Básico");
      }
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
    }
  }

  async function loadPaymentMethods(businessId: string) {
    try {
      const methodsData = await paymentMethodService.getPaymentMethods(businessId);
      setPaymentMethods(methodsData);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  }

  async function handleCreateEmployee() {
    if (!businessId || !newEmployeeEmail || !newEmployeePassword || !newEmployeeName) return;

    const canAdd = await subscriptionService.canAddEmployee();
    if (!canAdd.canAdd) {
      const plan = await subscriptionService.getCurrentPlan();
      setCurrentPlan(plan as "basic" | "professional" | "premium");
      
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      
      setEmployeeCount(count || 0);
      setShowUpgradeModal(true);
      return;
    }

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

      setNewEmployeeName("");
      setNewEmployeeEmail("");
      setNewEmployeePassword("");
      setNewEmployeeRole("cashier");

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
        type: "cash",
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

      const updatedBusiness = await businessService.getCurrentBusiness();
      if (updatedBusiness) {
        setBusiness(updatedBusiness);
        setBusinessName(updatedBusiness.name);
      }
      
      setCurrentView("menu");
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
      
      setCurrentView("menu");
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
      
      setCurrentView("menu");
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
      
      setCurrentView("menu");
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

  const settingsMenuItems = [
    {
      id: "business",
      title: "Información del Negocio",
      description: "Nombre, dirección, contacto y logo",
      icon: Building2,
      color: "bg-blue-500",
    },
    {
      id: "employees",
      title: "Empleados",
      description: "Gestiona tu equipo de trabajo",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      id: "payments",
      title: "Métodos de Pago",
      description: "Configura formas de pago aceptadas",
      icon: CreditCard,
      color: "bg-accent",
    },
    {
      id: "taxes",
      title: "Impuestos",
      description: "Configuración de IVA y otros impuestos",
      icon: DollarSign,
      color: "bg-amber-500",
    },
    {
      id: "printer",
      title: "Impresora de Tickets",
      description: "Configuración de impresora térmica",
      icon: Printer,
      color: "bg-pink-500",
    },
    {
      id: "customization",
      title: "Personalización",
      description: "Colores y estilo del sistema",
      icon: Palette,
      color: "bg-indigo-500",
    },
  ];

  return (
    <ProtectedRoute requiredPermission="settings">
      <SEO 
        title="Configuración - Nexum Cloud"
        description="Configuración del sistema"
      />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col">
          <Header 
            businessName={businessName}
            userName={userName}
            userEmail={userEmail}
            planName={planName}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8">
              {/* Header with back button */}
              <div className="mb-6">
                {currentView !== "menu" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("menu")}
                    className="mb-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Menú
                  </Button>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {currentView === "menu" ? "Configuración" : settingsMenuItems.find(i => i.id === currentView)?.title}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  {currentView === "menu" 
                    ? "Gestiona la configuración de tu negocio"
                    : settingsMenuItems.find(i => i.id === currentView)?.description
                  }
                </p>
              </div>

              {/* Settings Menu */}
              {currentView === "menu" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {settingsMenuItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setCurrentView(item.id as SettingsView)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${item.color} flex-shrink-0`}>
                            <item.icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Business Information View */}
              {currentView === "business" && (
                <Card>
                  <CardContent className="p-6 space-y-6">
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

                    <div className="border-t pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="logo">Logo del Negocio</Label>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                          {logoPreview && (
                            <div className="flex-shrink-0">
                              <img
                                src={logoPreview}
                                alt="Logo actual"
                                className="h-24 w-24 object-contain border rounded-lg bg-muted p-2"
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-2 w-full">
                            <Input
                              id="logo"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setLogoFile(file);
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
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setCurrentView("menu")}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveBusinessInfo} disabled={saving || uploadingLogo}>
                        <Save className="mr-2 h-4 w-4" />
                        {uploadingLogo ? "Subiendo logo..." : saving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employees View */}
              {currentView === "employees" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Gestión de Empleados</h3>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Crear Nuevo Empleado</CardTitle>
                      <CardDescription>Crea cuentas para tus cajeros o administradores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre completo</Label>
                          <Input
                            placeholder="Juan Pérez"
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
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </div>
                      
                      <Button 
                        onClick={handleCreateEmployee} 
                        disabled={creatingEmployee || !newEmployeeEmail || !newEmployeePassword || !newEmployeeName}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {creatingEmployee ? "Creando..." : "Crear Empleado"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Equipo de Trabajo</CardTitle>
                      <CardDescription>{employees.length} empleado{employees.length !== 1 ? "s" : ""} registrado{employees.length !== 1 ? "s" : ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {employees.map((emp) => (
                          <div
                            key={emp.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium truncate">{emp.user?.full_name || "Sin nombre"}</p>
                                  <Badge variant={emp.role === "owner" ? "default" : emp.role === "admin" ? "secondary" : "outline"} className="flex-shrink-0">
                                    {emp.role === "owner" ? "Propietario" : emp.role === "admin" ? "Admin" : "Cajero"}
                                  </Badge>
                                  {emp.is_active && <Badge variant="default" className="flex-shrink-0">Activo</Badge>}
                                  {!emp.is_active && <Badge variant="secondary" className="flex-shrink-0">Inactivo</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{emp.user?.email}</p>
                              </div>
                              
                              {emp.role !== "owner" && (
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditEmployeePermissions(emp)}
                                  >
                                    <SettingsIcon className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Permisos</span>
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payment Methods View */}
              {currentView === "payments" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agregar Método de Pago</CardTitle>
                      <CardDescription>Crea métodos de pago personalizados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nombre del método (ej. Efectivo, Tarjeta)"
                          value={newPaymentMethod}
                          onChange={(e) => setNewPaymentMethod(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleAddPaymentMethod} disabled={!newPaymentMethod.trim()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Métodos Configurados</CardTitle>
                      <CardDescription>{paymentMethods.length} método{paymentMethods.length !== 1 ? "s" : ""} disponible{paymentMethods.length !== 1 ? "s" : ""}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {paymentMethods.map((pm) => (
                          <div
                            key={pm.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <p className="font-medium truncate">{pm.name}</p>
                                <Badge variant={pm.is_active ? "default" : "secondary"} className="flex-shrink-0">
                                  {pm.is_active ? "Activo" : "Inactivo"}
                                </Badge>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Taxes View */}
              {currentView === "taxes" && (
                <Card>
                  <CardContent className="p-6 space-y-6">
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
                    
                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
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
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setCurrentView("menu")}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveTaxSettings} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Printer View */}
              {currentView === "printer" && (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="printer_width">Ancho de Papel</Label>
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
                        Selecciona el ancho de papel de tu impresora térmica
                      </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/50">
                      <h4 className="font-medium mb-3">Vista Previa del Ticket</h4>
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
                          </div>
                          <div>
                            <span>Fecha: 22/04/2026 12:30</span>
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

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setCurrentView("menu")}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePrinterConfig} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customization View */}
              {currentView === "customization" && (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="pos_name">Nombre del POS</Label>
                      <Input
                        id="pos_name"
                        value={customizationForm.pos_name}
                        onChange={(e) => setCustomizationForm({ ...customizationForm, pos_name: e.target.value })}
                        placeholder="Mi Sistema POS"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este nombre aparecerá en el sistema y en los tickets
                      </p>
                    </div>
                    
                    <div className="border-t pt-6 space-y-4">
                      <div>
                        <Label className="text-base">Paleta de Colores</Label>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                          Selecciona una paleta de colores predefinida para tu sistema
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {COLOR_PALETTES.map((palette) => (
                          <div
                            key={palette.id}
                            className={`
                              relative cursor-pointer rounded-lg border-2 p-4 transition-all
                              ${selectedPalette === palette.id 
                                ? "border-primary shadow-md" 
                                : "border-border hover:border-primary/50"
                              }
                            `}
                            onClick={() => handlePaletteSelect(palette.id)}
                          >
                            {selectedPalette === palette.id && (
                              <div className="absolute top-2 right-2">
                                <div className="rounded-full bg-primary p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-foreground">{palette.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{palette.description}</p>
                              </div>
                              
                              <div className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                  <div
                                    className="h-12 rounded border"
                                    style={{ backgroundColor: palette.primary }}
                                  />
                                  <p className="text-[10px] text-center text-muted-foreground">Primario</p>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div
                                    className="h-12 rounded border"
                                    style={{ backgroundColor: palette.secondary }}
                                  />
                                  <p className="text-[10px] text-center text-muted-foreground">Secundario</p>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div
                                    className="h-12 rounded border"
                                    style={{ backgroundColor: palette.accent }}
                                  />
                                  <p className="text-[10px] text-center text-muted-foreground">Acento</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedPalette !== "custom" && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Palette className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Vista Previa</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Los cambios se aplicarán al guardar. Recarga la página después para ver los colores en todo el sistema.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setCurrentView("menu")}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveCustomization} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Guardando..." : "Guardar y Aplicar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>

        {/* Employee Permissions Dialog */}
        <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Permisos</DialogTitle>
              <DialogDescription>
                Configura los permisos de acceso para {editingEmployee?.user?.full_name || editingEmployee?.user?.email}
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

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="employees"
        currentPlan={currentPlan}
        currentLimit={employeeCount}
        suggestedPlan={currentPlan === "basic" ? "professional" : "premium"}
      />
    </ProtectedRoute>
  );
}