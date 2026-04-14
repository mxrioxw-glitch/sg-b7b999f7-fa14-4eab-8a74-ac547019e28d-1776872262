import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { ProductModal } from "@/components/ProductModal";
import { TicketPreview } from "@/components/TicketPreview";
import { PaymentModal } from "@/components/PaymentModal";
import { CustomerIdentificationModal } from "@/components/CustomerIdentificationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { productService, type ProductWithDetails } from "@/services/productService";
import { categoryService, type Category } from "@/services/categoryService";
import { saleService } from "@/services/saleService";
import { paymentMethodService, type PaymentMethod } from "@/services/paymentMethodService";
import { supabase } from "@/integrations/supabase/client";
import { Search, AlertCircle, DollarSign } from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  extras?: string[];
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  points: number;
}

export default function POSPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [cashRegisterId, setCashRegisterId] = useState<string | null>(null);
  const [noCashRegisterDialog, setNoCashRegisterDialog] = useState(false);
  const [taxRate, setTaxRate] = useState(16);
  const [businessData, setBusinessData] = useState<{
    name: string;
    address?: string;
    phone?: string;
    printerWidth?: "58mm" | "80mm";
  } | null>(null);

  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [customerIdentificationOpen, setCustomerIdentificationOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [ticketPreviewOpen, setTicketPreviewOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    saleId: string;
    date: Date;
  } | null>(null);

  useEffect(() => {
    initializePOS();
  }, []);

  const initializePOS = async () => {
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const business = await businessService.getBusinessByOwnerId(session.user.id);
      if (!business) {
        toast({
          title: "No hay negocios",
          description: "Necesitas crear un negocio primero",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      setBusinessId(business.id);
      setTaxRate(Number(business.tax_rate) || 16);
      setBusinessData({
        name: business.name,
        address: business.address || undefined,
        phone: business.phone || undefined,
        printerWidth: (business.printer_width as "58mm" | "80mm") || "80mm",
      });

      // Get employee record for this user
      const employee = await businessService.getEmployeeByUserId(session.user.id);
      if (!employee) {
        // If no employee record exists, create one
        const { data: newEmployee, error: empError } = await supabase
          .from("employees")
          .insert({
            business_id: business.id,
            user_id: session.user.id,
            role: "owner",
            is_active: true
          })
          .select()
          .single();

        if (empError) {
          console.error("Error creating employee:", empError);
          toast({
            title: "Error",
            description: "Error al configurar el empleado",
            variant: "destructive",
          });
          return;
        }
        setEmployeeId(newEmployee.id);
      } else {
        setEmployeeId(employee.id);
      }

      // Get active cash register for this employee
      const { data: activeCashRegister, error: cashRegError } = await supabase
        .from("cash_registers")
        .select("id")
        .eq("business_id", business.id)
        .eq("employee_id", employee?.id || session.user.id)
        .eq("status", "open")
        .maybeSingle();

      if (cashRegError) {
        console.error("Error fetching active cash register:", cashRegError);
      }

      if (activeCashRegister) {
        setCashRegisterId(activeCashRegister.id);
      } else {
        // No active cash register - show blocking dialog
        setNoCashRegisterDialog(true);
      }

      const [categoriesData, productsData, customersData] = await Promise.all([
        categoryService.getCategories(business.id),
        productService.getProducts(business.id),
        loadCustomers(business.id),
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error initializing POS:", error);
      toast({
        title: "Error",
        description: "Error al inicializar el punto de venta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (businessId: string): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, loyalty_points")
      .eq("business_id", businessId)
      .order("name");

    if (error) {
      console.error("Error loading customers:", error);
      return [];
    }

    return (data || []).map(c => ({
      id: c.id,
      name: c.name,
      points: c.loyalty_points || 0,
    }));
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: ProductWithDetails) => {
    if (!cashRegisterId) {
      toast({
        title: "Sin turno activo",
        description: "Necesitas abrir un turno de caja primero",
        variant: "destructive",
      });
      return;
    }
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleAddToCart = (item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    extras?: string[];
    notes?: string;
  }) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      ...item,
    };
    setCartItems((prev) => [...prev, newItem]);
    toast({
      title: "Agregado al carrito",
      description: `${item.name} x${item.quantity}`,
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    toast({
      title: "Eliminado",
      description: "Producto eliminado del carrito",
    });
  };

  const handleCheckout = () => {
    if (!cashRegisterId) {
      setNoCashRegisterDialog(true);
      return;
    }
    if (cartItems.length === 0) return;
    setCustomerIdentificationOpen(true);
  };

  const handleCustomerIdentified = (customerId: string | null) => {
    setSelectedCustomerId(customerId);
    setCustomerIdentificationOpen(false);
    setPaymentModalOpen(true);
  };

  const handleProcessPayment = async (payments: any[], change: number) => {
    if (!businessId || !employeeId || !cashRegisterId) return;

    setProcessingPayment(true);
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      // Calculate loyalty points from products
      let totalPoints = 0;
      for (const item of cartItems) {
        const product = products.find((p) => p.id === item.productId);
        if (product && product.generates_points && product.points_value) {
          totalPoints += Number(product.points_value) * item.quantity;
        }
      }

      // For now, use first payment method or create a default one
      // In production, you'd handle multiple payments properly
      const { data: paymentMethods } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("business_id", businessId)
        .limit(1);

      const paymentMethodId = paymentMethods?.[0]?.id;

      const { sale, error } = await saleService.createSale({
        businessId,
        employeeId,
        cashRegisterId,
        paymentMethodId,
        customerId: selectedCustomerId || undefined,
        subtotal,
        taxAmount,
        total,
        items: cartItems.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          const extrasData = item.extras?.map((extraName) => {
            const extra = product?.extras?.find((e) => e.name === extraName);
            return {
              extraName,
              price: extra?.price || 0,
            };
          }) || [];

          return {
            productId: item.productId,
            productName: item.name,
            variantName: item.variant,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
            notes: item.notes,
            extras: extrasData,
          };
        }),
      });

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      // Award loyalty points if customer was identified
      if (selectedCustomerId && totalPoints > 0) {
        const customer = customers.find(c => c.id === selectedCustomerId);
        const newPoints = (customer?.points || 0) + totalPoints;

        const { error: pointsError } = await supabase
          .from("customers")
          .update({
            loyalty_points: newPoints
          })
          .eq("id", selectedCustomerId);

        if (pointsError) {
          console.error("Error updating loyalty points:", pointsError);
        } else {
          // Update local state to reflect new points immediately
          setCustomers(prev => prev.map(c => 
            c.id === selectedCustomerId ? { ...c, points: newPoints } : c
          ));

          toast({
            title: "¡Puntos ganados!",
            description: `El cliente ganó ${totalPoints} puntos de lealtad`,
          });
        }
      }

      setCompletedSale({
        saleId: sale!.id,
        date: new Date(),
      });
      setPaymentModalOpen(false);
      setTicketPreviewOpen(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Error al procesar el pago",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmSale = () => {
    setCartItems([]);
    setCompletedSale(null);
    setSelectedCustomerId(null);
    setTicketPreviewOpen(false);
    
    toast({
      title: "¡Venta completada!",
      description: "Ticket generado exitosamente",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando POS...</p>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          {!cashRegisterId && (
            <Alert variant="destructive" className="m-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sin turno de caja activo</AlertTitle>
              <AlertDescription>
                No puedes realizar ventas sin un turno abierto. Ve a "Corte de Caja" para abrir tu turno.
              </AlertDescription>
            </Alert>
          )}

          <div className="container mx-auto flex gap-6 p-6">
            <div className="flex-1">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-10 text-base"
                    disabled={!cashRegisterId}
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="all" disabled={!cashRegisterId}>Todos</TabsTrigger>
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} disabled={!cashRegisterId}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={Number(product.base_price)}
                    category={product.category?.name || "Sin categoría"}
                    image={product.image_url || undefined}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No se encontraron productos</p>
                </div>
              )}
            </div>

            <div className="w-96">
              <Cart
                items={cartItems}
                taxRate={taxRate}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </main>
      </div>

      {/* No Cash Register Dialog */}
      <Dialog open={noCashRegisterDialog} onOpenChange={setNoCashRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Sin Turno de Caja Activo
            </DialogTitle>
            <DialogDescription>
              No puedes realizar ventas sin un turno de caja abierto. Ve al módulo de "Corte de Caja" para abrir tu turno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoCashRegisterDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => router.push("/cash-register")}>
              Ir a Corte de Caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Configuration Modal */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={
          selectedProduct
            ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                basePrice: Number(selectedProduct.base_price),
                image: selectedProduct.image_url || undefined,
                variants: selectedProduct.variants?.map((v) => ({
                  id: v.id,
                  name: v.name,
                  priceModifier: Number(v.price_modifier),
                })),
                extras: selectedProduct.extras?.map((e) => ({
                  id: e.id,
                  name: e.name,
                  price: Number(e.price),
                })),
              }
            : null
        }
        onAddToCart={handleAddToCart}
      />

      {/* Customer Identification Modal */}
      <CustomerIdentificationModal
        open={customerIdentificationOpen}
        onOpenChange={setCustomerIdentificationOpen}
        customers={customers}
        onContinue={handleCustomerIdentified}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        total={total}
        subtotal={subtotal}
        taxAmount={taxAmount}
        taxRate={taxRate}
        customers={customers}
        onConfirm={handleProcessPayment}
        processing={processingPayment}
      />

      {/* Ticket Preview Modal */}
      {completedSale && businessData && (
        <TicketPreview
          open={ticketPreviewOpen}
          onOpenChange={setTicketPreviewOpen}
          businessName={businessData.name}
          businessAddress={businessData.address}
          businessPhone={businessData.phone}
          printerWidth={businessData.printerWidth}
          saleId={completedSale.saleId}
          items={cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
            variant: item.variant,
            extras: item.extras,
            notes: item.notes,
          }))}
          subtotal={subtotal}
          taxRate={taxRate}
          taxAmount={taxAmount}
          total={total}
          paymentMethod="Mixto"
          date={completedSale.date}
          onConfirm={handleConfirmSale}
        />
      )}
    </div>
  );
}