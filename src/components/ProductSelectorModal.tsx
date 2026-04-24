import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Check } from "lucide-react";
import { ProductModal } from "@/components/ProductModal";

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: any, variant?: any, extras?: any[], notes?: string, quantity?: number) => void;
  products: any[];
  categories: any[];
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSelectProduct,
  products,
  categories,
}: ProductSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productsAdded, setProductsAdded] = useState(0);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  function handleProductClick(product: any) {
    setSelectedProduct(product);
    setShowProductModal(true);
  }

  function handleProductSelect(product: any, variant?: any, extras?: any[], notes?: string, quantity?: number) {
    onSelectProduct(product, variant, extras, notes, quantity);
    setProductsAdded(prev => prev + 1);
    setShowProductModal(false);
    setSelectedProduct(null);
    // NO cerramos el modal principal - dejamos que el usuario siga agregando
  }

  function handleClose() {
    setSearchQuery("");
    setSelectedCategory(null);
    setProductsAdded(0);
    onClose();
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[95vh] p-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">Seleccionar Platillo</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {productsAdded > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" className="bg-accent text-accent-foreground">
                  <Check className="h-3 w-3 mr-1" />
                  {productsAdded} {productsAdded === 1 ? "producto agregado" : "productos agregados"}
                </Badge>
              </div>
            )}

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar platillos, bebidas, postres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todas
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </SheetHeader>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="group relative bg-card border rounded-lg overflow-hidden hover:border-accent transition-all hover:shadow-lg"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-muted flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-accent">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t flex-shrink-0">
            <Button
              onClick={handleClose}
              size="lg"
              className="w-full"
            >
              Continuar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Product Configuration Modal */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleProductSelect}
        product={selectedProduct}
      />
    </>
  );
}