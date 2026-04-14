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
import { Search, AlertCircle, DollarSign, ShoppingCart, ChevronLeft, Package } from "lucide-react";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

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
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const isMobileOrTablet = useIsMobileOrTablet();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkSubscriptionAndBusiness();
  }, []);

  async function checkSubscriptionAndBusiness() {
    try {
      const isActive = await subscriptionService.checkSubscriptionStatus();
      if (!isActive) {
        router.push("/subscription");
        return;
      }

      const currentBusiness = await businessService.getCurrentBusiness();
      if (!currentBusiness) {
        router.push("/");
        return;
      }

      setBusiness(currentBusiness);
      await Promise.all([
        loadCategories(currentBusiness.id),
        loadProducts(currentBusiness.id),
        loadActiveCashRegister(currentBusiness.id),
      ]);
    } catch (error) {
      console.error("Error loading POS:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el punto de venta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadActiveCashRegister(businessId: string) {
    const registers = await cashRegisterService.getCashRegisters(businessId);
    const active = registers.find(r => r.status === "open");
    setCashRegister(active || null);
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
        product,
        variant: null,
        extras: [],
        quantity: 1,
        unitPrice: Number(product.base_price),
        subtotal: Number(product.base_price),
        notes: "",
      });
    }
  };

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
    setShowProductModal(false);
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de proceder al pago",
        variant: "destructive",
      });
      return;
    }

    if (!cashRegister) {
      toast({
        title: "Corte de caja requerido",
        description: "Debes abrir un corte de caja antes de realizar ventas",
        variant: "destructive",
      });
      router.push("/cash-register");
      return;
    }

    setShowPayment(true);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          businessName={business.name}
          userName={business.name}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Products Section - Full width on mobile, left side on desktop */}
            <div className={cn(
              "flex-1 flex flex-col overflow-hidden",
              isMobileOrTablet && cart.length > 0 ? "hidden" : "flex"
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

                {/* Categories - Horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
                  <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap">
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
              <div className="flex-1 overflow-y-auto p-3 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => handleProductClick(product)}
                    />
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Package className="h-12 w-12 mb-2" />
                    <p>No se encontraron productos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Section - Full width on mobile when has items, right side on desktop */}
            <div className={cn(
              "lg:w-96 xl:w-[420px] border-l border-border bg-card flex flex-col",
              isMobileOrTablet ? "w-full" : "",
              isMobileOrTablet && cart.length === 0 ? "hidden" : "flex"
            )}>
              {/* Mobile: Back button */}
              {isMobileOrTablet && cart.length > 0 && (
                <div className="border-b border-border p-3 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCart([])}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-lg font-semibold">Carrito ({cart.length})</h2>
                </div>
              )}

              <Cart
                items={cart}
                onUpdateItem={updateCartItem}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
                selectedCustomer={selectedCustomer}
                onCustomerClick={() => setShowCustomerModal(true)}
              />
            </div>
          </div>

          {/* Mobile: Floating Cart Button */}
          {isMobileOrTablet && cart.length > 0 && (
            <div className="fixed bottom-4 right-4 left-4 z-40 lg:hidden">
              <Button
                className="w-full h-14 text-lg shadow-lg"
                size="lg"
                onClick={() => {
                  // Show cart section
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Ver Carrito ({cart.length}) - ${cartTotal.toFixed(2)}
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setShowProductModal(false)}
          onAddToCart={addToCart}
        />
      )}

      {showPayment && business && cashRegister && (
        <PaymentModal
          items={cart}
          businessId={business.id}
          cashRegisterId={cashRegister.id}
          customer={selectedCustomer}
          onClose={() => setShowPayment(false)}
          onComplete={() => {
            clearCart();
            setShowPayment(false);
            toast({
              title: "Venta completada",
              description: "La venta se registró correctamente",
            });
          }}
        />
      )}

      {showCustomerModal && business && (
        <CustomerIdentificationModal
          businessId={business.id}
          onClose={() => setShowCustomerModal(false)}
          onCustomerSelected={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerModal(false);
          }}
        />
      )}
    </div>
  );
}