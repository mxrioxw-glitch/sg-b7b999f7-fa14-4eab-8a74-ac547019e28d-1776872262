import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { ProductModal } from "@/components/ProductModal";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/ui/loading";
import { productService, type ProductWithDetails } from "@/services/productService";
import { categoryService, type Category } from "@/services/categoryService";
import { businessService } from "@/services/businessService";
import { subscriptionService } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

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

export default function POSPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [needsBusinessSetup, setNeedsBusinessSetup] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [settingUpBusiness, setSettingUpBusiness] = useState(false);

  useEffect(() => {
    checkAuthAndBusiness();
  }, []);

  const checkAuthAndBusiness = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Check if user has a business
      const business = await businessService.getBusinessByOwnerId(user.id);
      
      if (!business) {
        setNeedsBusinessSetup(true);
        setLoading(false);
        return;
      }

      // Load data normally
      loadData();
    } catch (error) {
      console.error("Error checking auth/business:", error);
      setLoading(false);
    }
  };

  const handleBusinessSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    setSettingUpBusiness(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create business
      const { business, error } = await businessService.createBusiness({
        name: businessName,
        email: user.email || ""
      });

      if (error || !business) {
        alert("Error al crear el negocio. Por favor intenta de nuevo.");
        setSettingUpBusiness(false);
        return;
      }

      // Create employee record
      await supabase
        .from("employees")
        .insert({
          business_id: business.id,
          user_id: user.id,
          role: "owner",
          is_active: true
        });

      // Create trial subscription
      await subscriptionService.createTrialSubscription(business.id);

      // Reload page
      setNeedsBusinessSetup(false);
      loadData();
    } catch (error) {
      console.error("Error setting up business:", error);
      alert("Error inesperado. Por favor intenta de nuevo.");
      setSettingUpBusiness(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, productsData] = await Promise.all([
        categoryService.getCategories(DEMO_BUSINESS_ID),
        productService.getProducts(DEMO_BUSINESS_ID),
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleAddToCart = (item: Omit<CartItem, "id">) => {
    setCartItems((prev) => [...prev, { ...item, id: Date.now().toString() }]);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleCheckout = () => {
    alert("🎉 Procesando pago...\n\nEsta funcionalidad se implementará en la siguiente fase.");
    setCartItems([]);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (needsBusinessSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Configuración inicial</CardTitle>
            <CardDescription>
              Para empezar a usar el sistema POS, necesitas configurar tu negocio.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleBusinessSetup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input
                  id="businessName"
                  placeholder="Mi Cafetería"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  disabled={settingUpBusiness}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={settingUpBusiness || !businessName.trim()}
              >
                {settingUpBusiness ? "Configurando..." : "Continuar"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header businessName="Café Demo" userName="Admin" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border bg-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadData}
                  title="Recargar productos"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full lg:w-auto">
                <TabsList className="grid w-full grid-cols-auto lg:w-auto">
                  <TabsTrigger value="all" className="text-xs lg:text-sm">
                    Todas
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className="text-xs lg:text-sm">
                      {category.icon} {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
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
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <Search className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No se encontraron productos</p>
                  <p className="text-sm">Intenta con otra búsqueda o categoría</p>
                </div>
              )}
            </div>

            <div className="w-96 border-l border-border bg-card">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </main>
      </div>

      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          basePrice: Number(selectedProduct.base_price),
          image: selectedProduct.image_url || undefined,
          variants: selectedProduct.variants?.map(v => ({
            id: v.id,
            name: v.name,
            priceModifier: Number(v.price_modifier),
          })),
          extras: selectedProduct.extras?.map(e => ({
            id: e.id,
            name: e.name,
            price: Number(e.price),
          })),
        } : null}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}