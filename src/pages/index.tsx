import { useState } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { ProductModal } from "@/components/ProductModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Café Americano",
    basePrice: 35,
    category: "Bebidas Calientes",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400",
    variants: [
      { id: "small", name: "Chico", priceModifier: 0 },
      { id: "medium", name: "Mediano", priceModifier: 10 },
      { id: "large", name: "Grande", priceModifier: 20 },
    ],
    extras: [
      { id: "shot", name: "Shot Extra", price: 15 },
      { id: "vanilla", name: "Vainilla", price: 10 },
      { id: "caramel", name: "Caramelo", price: 10 },
    ],
  },
  {
    id: "2",
    name: "Latte",
    basePrice: 45,
    category: "Bebidas Calientes",
    image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400",
    variants: [
      { id: "small", name: "Chico", priceModifier: 0 },
      { id: "medium", name: "Mediano", priceModifier: 10 },
      { id: "large", name: "Grande", priceModifier: 20 },
    ],
    extras: [
      { id: "oat", name: "Leche de Avena", price: 15 },
      { id: "almond", name: "Leche de Almendra", price: 15 },
      { id: "vanilla", name: "Vainilla", price: 10 },
    ],
  },
  {
    id: "3",
    name: "Cappuccino",
    basePrice: 42,
    category: "Bebidas Calientes",
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
    variants: [
      { id: "small", name: "Chico", priceModifier: 0 },
      { id: "medium", name: "Mediano", priceModifier: 10 },
    ],
    extras: [
      { id: "cinnamon", name: "Canela", price: 5 },
      { id: "chocolate", name: "Chocolate", price: 10 },
    ],
  },
  {
    id: "4",
    name: "Croissant",
    basePrice: 35,
    category: "Panadería",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400",
  },
  {
    id: "5",
    name: "Muffin de Arándanos",
    basePrice: 40,
    category: "Panadería",
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400",
  },
  {
    id: "6",
    name: "Sandwich Jamón y Queso",
    basePrice: 65,
    category: "Alimentos",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
  },
];

const CATEGORIES = ["Todas", "Bebidas Calientes", "Bebidas Frías", "Panadería", "Alimentos"];

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === "Todas" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: typeof MOCK_PRODUCTS[0]) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleAddToCart = (item: any) => {
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header businessName="Café Espresso" userName="Admin" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border bg-card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full lg:w-auto">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                  {CATEGORIES.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-xs lg:text-sm">
                      {category}
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
                    price={product.basePrice}
                    category={product.category}
                    image={product.image}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  No se encontraron productos
                </div>
              )}
            </div>

            <div className="w-96 border-l border-border bg-card">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={() => alert("Procesando pago...")}
              />
            </div>
          </div>
        </main>
      </div>

      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}