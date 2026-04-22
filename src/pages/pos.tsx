import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { ProductModal } from "@/components/ProductModal";
import { PaymentModal } from "@/components/PaymentModal";
import { CustomerIdentificationModal } from "@/components/CustomerIdentificationModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TicketPreview } from "@/components/TicketPreview";
import { QuickCashRegister } from "@/components/QuickCashRegister";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { businessService } from "@/services/businessService";
import { categoryService, type Category } from "@/services/categoryService";
import { productService, type ProductWithDetails } from "@/services/productService";
import { getCashRegisters, openCashRegister, type CashRegister } from "@/services/cashRegisterService";
import { getCustomers, redeemLoyaltyPoints } from "@/services/customerService";
import { saleService } from "@/services/saleService";
import { subscriptionService } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { Search, Package, ShoppingCart, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";
import type { Business } from "@/services/businessService";
import { GetServerSidePropsContext } from "next";

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

export const getServerSideProps = requireActiveSubscription;

export default function POSPage() {
  return (
    <ProtectedRoute requiredPermission="pos">
      <POSContent />
    </ProtectedRoute>
  );
}

function POSContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [showPayment, setShowPayment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);

  const [quickCashRegisterOpen, setQuickCashRegisterOpen] = useState(false);
  const [processingCashRegister, setProcessingCashRegister] = useState(false);

  const isMobileOrTablet = useIsMobileOrTablet();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");

  useEffect(() => {
    async function checkSubscriptionAndLoadData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // Get user's business
        const business = await businessService.getCurrentBusiness();
        if (!business) {
          router.push("/");
          return;
        }

        // SOLO verificar suscripción si el usuario es el DUEÑO del negocio
        // Los empleados/cajeros NO deben ver mensajes de suscripción
        const isOwner = business.owner_id === user.id;
        
        if (isOwner) {
          // Solo el dueño ve notificaciones de suscripción
          const isActive = await subscriptionService.isSubscriptionActive();
          if (!isActive) {
            toast({
              title: "⚠️ Suscripción Requerida",
              description: "Tu período de prueba ha expirado. Por favor, actualiza tu suscripción.",
              variant: "destructive",
              duration: 5000,
            });
            router.push("/subscription");
            return;
          }
        }
        // Si es empleado, continuar normalmente SIN verificar suscripción

        // Load data
        await Promise.all([
          loadCategories(),
          loadProducts(),
          loadPaymentMethods(),
        ]);
      } catch (error) {
        console.error("Error in POS initialization:", error);
      }
    }

    checkSubscriptionAndLoadData();
  }, []);

  async function loadActiveCashRegister(businessId: string) {
    try {
      const registers = await getCashRegisters(businessId);
      const active = registers.find(r => r.status === "open");
      setCashRegister(active || null);
      
      if (!active) {
        toast({
          title: "Corte de caja no iniciado",
          description: "Abre un corte de caja en la sección 'Corte de Caja' antes de realizar ventas",
        });
      }
    } catch (e) {
      console.error("Error loading cash register:", e);
    }
  }

  async function loadCategories(businessId: string) {
    const cats = await categoryService.getCategories(businessId);
    setCategories(cats);
  }

  async function loadProducts(businessId: string, categoryId?: string) {
    const prods = categoryId
      ? await productService.getProductsByCategory(businessId, categoryId)
      : await productService.getProducts(businessId);
    setProducts(prods);
  }

  async function loadCustomers(businessId: string) {
    try {
      const data = await getCustomers(businessId);
      setCustomers(data.map(c => ({ id: c.id, name: c.name, points: c.loyalty_points || 0 })));
    } catch (e) {}
  }

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (business) {
      loadProducts(business.id, categoryId || undefined);
    }
  };

  const handleProductClick = (product: ProductWithDetails) => {
    if (product.has_variants || product.has_extras) {
      setSelectedProduct(product);
      setShowProductModal(true);
    } else {
      addToCart({
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price: Number(product.base_price),
        quantity: 1,
      });
    }
  };

  function addToCart(item: CartItem) {
    setCart(prev => {
      const existing = prev.find(i => 
        i.productId === item.productId && 
        i.variant === item.variant &&
        JSON.stringify(i.extras) === JSON.stringify(item.extras)
      );

      if (existing) {
        toast({
          title: "🛒 Cantidad actualizada",
          description: `${item.name} (${existing.quantity + 1})`,
          duration: 2000,
        });
        return prev.map(i => 
          i === existing 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      toast({
        title: "➕ Producto agregado",
        description: item.name,
        duration: 2000,
      });
      return [...prev, item];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart(cart.map(item => item.id === itemId ? { ...item, quantity } : item));
  };

  function removeFromCart(id: string) {
    const item = cart.find(i => i.id === id);
    if (item) {
      toast({
        title: "🗑️ Producto eliminado",
        description: item.name,
        duration: 2000,
      });
      setCart(prev => prev.filter(i => i.id !== id));
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = business?.tax_rate || 16;
  const cartTax = cartSubtotal * (taxRate / 100);
  const cartTotal = cartSubtotal + cartTax;

  const handlePaymentConfirm = async (payments: any[], change: number) => {
    if (!business) return;
    
    // Warn if no cash register but allow sale
    if (!cashRegister) {
      toast({
        title: "Advertencia",
        description: "No hay un corte de caja abierto. La venta se registrará sin caja.",
      });
    }
    
    setProcessingPayment(true);
    try {
      const { sale, error } = await saleService.createSale({
        businessId: business.id,
        employeeId: cashRegister?.employee_id || undefined,
        cashRegisterId: cashRegister?.id || undefined,
        customerId: selectedCustomer?.id || undefined,
        subtotal: cartSubtotal,
        taxAmount: cartTax,
        total: cartTotal,
        notes: payments.map(p => `${p.type}: ${p.amount}`).join(", "),
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          variantName: item.variant,
          extras: item.extras?.map(e => ({ extraName: e, price: 0 })) || [],
          notes: item.notes
        }))
      });

      if (error || !sale) {
        throw new Error(error || "Error al procesar la venta");
      }

      // Auto-deduct loyalty points if customer paid with points
      const pointsPayment = payments.find(p => p.type === "points");
      if (pointsPayment && selectedCustomer) {
        try {
          await redeemLoyaltyPoints(selectedCustomer.id, pointsPayment.amount);
          console.log(`✅ Deducted ${pointsPayment.amount} points from customer ${selectedCustomer.name}`);
        } catch (pointsError) {
          console.error("Error deducting loyalty points:", pointsError);
          // Don't fail the sale if points deduction fails
          toast({
            title: "Advertencia",
            description: "La venta se completó pero hubo un error al descontar los puntos",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Venta completada",
        description: "La venta se ha registrado correctamente",
      });

      // Clear cart
      setCart([]);
      setShowPayment(false);
      setSelectedCustomer(null);
      setTicketData({
         businessName: business.name,
         date: new Date().toLocaleString(),
         items: cart,
         subtotal: cartSubtotal,
         taxRate,
         tax: cartTax,
         total: cartTotal,
         payments,
         change,
         saleId: sale.id.substring(0, 8)
      });
      setShowTicket(true);
      if (isMobileOrTablet) {
        setMobileView("products");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar la venta",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  async function handleQuickOpenCashRegister(amount: number, notes: string) {
    if (!business) return;

    setProcessingCashRegister(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("business_id", business.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!employee) {
        throw new Error("No se encontró el empleado");
      }

      await openCashRegister({
        businessId: business.id,
        employeeId: employee.id,
        openingAmount: amount,
        notes,
      });

      toast({
        title: "Turno abierto",
        description: "El turno de caja se ha abierto correctamente",
      });

      setQuickCashRegisterOpen(false);
      await loadActiveCashRegister(business.id);
    } catch (error: any) {
      console.error("Error opening cash register:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo abrir el turno",
        variant: "destructive",
      });
    } finally {
      setProcessingCashRegister(false);
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando punto de venta...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SEO 
        title="Punto de Venta - Nexum Cloud"
        description="Sistema de punto de venta de Nexum Cloud"
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={business.name}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-hidden relative">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Products Section */}
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden",
              isMobileOrTablet && mobileView === "cart" ? "hidden" : "flex"
            )}>
              {/* Categories & Search */}
              <div className="border-b border-border bg-card p-3 md:p-4 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 md:h-11"
                  />
                </div>

                {/* Categories */}
                <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0 scrollbar-hide">
                  <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap pb-1">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      onClick={() => handleCategoryClick(null)}
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Todos
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        onClick={() => handleCategoryClick(cat.id)}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {cat.icon} {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
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
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Package className="h-12 w-12 mb-2 opacity-50" />
                    <p>No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Section */}
            <div className={cn(
              "lg:w-96 xl:w-[420px] border-l border-border bg-card flex flex-col",
              isMobileOrTablet && mobileView === "products" ? "hidden" : "flex",
              isMobileOrTablet ? "w-full h-full absolute inset-0 z-30 bg-card" : ""
            )}>
              {isMobileOrTablet && (
                <div className="border-b border-border bg-card p-3 flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setMobileView("products")}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-lg font-semibold">Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})</h2>
                </div>
              )}
              <Cart
                items={cart}
                taxRate={taxRate}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => {
                  if (cart.length === 0) return;
                  setShowCustomerModal(true);
                }}
                className="flex-1 border-none shadow-none rounded-none"
              />
            </div>
          </div>

          {/* Mobile: Floating Cart Button */}
          {isMobileOrTablet && mobileView === "products" && cart.length > 0 && (
            <div className="absolute bottom-4 right-4 left-4 z-20 lg:hidden">
              <Button
                className="w-full h-14 text-lg shadow-lg"
                size="lg"
                onClick={() => setMobileView("cart")}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ver Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)}) - ${cartTotal.toFixed(2)}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showProductModal && selectedProduct && (
        <ProductModal
          open={showProductModal}
          onOpenChange={setShowProductModal}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            basePrice: Number(selectedProduct.base_price),
            image: selectedProduct.image_url || undefined,
            variants: selectedProduct.variants?.map(v => ({ id: v.id, name: v.name, priceModifier: Number(v.price_modifier) })) || [],
            extras: selectedProduct.extras?.map(e => ({ id: e.id, name: e.name, price: Number(e.price) })) || []
          }}
          onAddToCart={addToCart}
        />
      )}

      {showPayment && business && (
        <PaymentModal
          open={showPayment}
          onOpenChange={setShowPayment}
          total={cartTotal}
          subtotal={cartSubtotal}
          taxAmount={cartTax}
          taxRate={taxRate}
          customers={customers}
          onConfirm={handlePaymentConfirm}
          processing={processingPayment}
          hasCashRegister={!!cashRegister}
          onOpenCashRegister={() => setQuickCashRegisterOpen(true)}
        />
      )}

      {showCustomerModal && (
        <CustomerIdentificationModal
          open={showCustomerModal}
          onOpenChange={setShowCustomerModal}
          customers={customers}
          onContinue={(customerId) => {
            if (customerId) {
              const c = customers.find(x => x.id === customerId);
              if (c) setSelectedCustomer(c);
            }
            setShowCustomerModal(false);
            setShowPayment(true);
          }}
        />
      )}

      {showTicket && ticketData && (
        <TicketPreview 
          open={showTicket} 
          onOpenChange={setShowTicket}
          businessName={ticketData.businessName}
          date={new Date()}
          items={ticketData.items.map((i: any) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.price,
            total: i.price * i.quantity,
            variant: i.variant,
            extras: i.extras,
            notes: i.notes
          }))}
          subtotal={ticketData.subtotal}
          taxRate={ticketData.taxRate}
          taxAmount={ticketData.tax}
          total={ticketData.total}
          paymentMethod={ticketData.payments.map((p: any) => p.type).join(", ")}
          saleId={ticketData.saleId}
          onConfirm={() => setShowTicket(false)}
        />
      )}

      {/* Quick Cash Register Dialog */}
      <QuickCashRegister
        open={quickCashRegisterOpen}
        onOpenChange={setQuickCashRegisterOpen}
        mode="open"
        onConfirm={handleQuickOpenCashRegister}
        processing={processingCashRegister}
      />
    </div>
  );
}