import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { ProductModal } from "@/components/ProductModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { businessService } from "@/services/businessService";
import { productService, type ProductWithDetails } from "@/services/productService";
import { categoryService, type Category } from "@/services/categoryService";
import { saleService } from "@/services/saleService";
import { paymentMethodService, type PaymentMethod } from "@/services/paymentMethodService";
import { Search, DollarSign } from "lucide-react";

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
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(16);

  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    initializePOS();
  }, []);

  const initializePOS = async () => {
    try {
      const session = await authService.getSession();
      if (!session) {
        router.push("/auth/login");
        return;
      }

      const businesses = await businessService.getBusinesses(session.user.id);
      if (businesses.length === 0) {
        toast({
          title: "No hay negocios",
          description: "Necesitas crear un negocio primero",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      const business = businesses[0];
      setBusinessId(business.id);
      setTaxRate(Number(business.tax_rate) || 16);

      // TODO: Get employee_id from employees table based on user_id
      // For now, we'll need to create an employee record or get it
      setEmployeeId(session.user.id);

      const [categoriesData, productsData, paymentMethodsData] = await Promise.all([
        categoryService.getCategories(business.id),
        productService.getProducts(business.id),
        paymentMethodService.getPaymentMethods(business.id),
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setPaymentMethods(paymentMethodsData);
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

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: ProductWithDetails) => {
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
    if (cartItems.length === 0) return;
    if (paymentMethods.length === 0) {
      toast({
        title: "Sin métodos de pago",
        description: "Configura métodos de pago en ajustes",
        variant: "destructive",
      });
      return;
    }
    setSelectedPaymentMethod(paymentMethods[0].id);
    setPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!businessId || !employeeId || !selectedPaymentMethod) return;

    setProcessingPayment(true);
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const { sale, error } = await saleService.createSale({
        businessId,
        employeeId,
        subtotal,
        taxAmount,
        total,
        items: cartItems.map((item) => {
          // Find the product to get extras prices
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

      toast({
        title: "¡Venta completada!",
        description: `Total: $${total.toFixed(2)}`,
      });

      // Clear cart and close modal
      setCartItems([]);
      setPaymentModalOpen(false);
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto flex gap-6 p-6">
        {/* Main Content - Products */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 pl-10 text-base"
              />
            </div>
          </div>

          {/* Categories Filter */}
          {categories.length > 0 && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* Products Grid */}
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

        {/* Sidebar - Cart */}
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

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Procesar Pago
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="mb-3 block">Método de pago</Label>
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      {method.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={processingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={!selectedPaymentMethod || processingPayment}
              className="min-w-32"
            >
              {processingPayment ? "Procesando..." : `Cobrar $${total.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}