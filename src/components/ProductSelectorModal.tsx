import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "@/components/ProductModal";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category_id?: string;
  variants?: any[];
  extras?: any[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product, variant?: any, extras?: any[], notes?: string, quantity?: number) => void;
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  products,
  categories,
  onSelectProduct,
}: ProductSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategoryId || product.category_id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const handleProductClick = (product: Product) => {
    const hasVariants = product.variants && product.variants.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;

    if (hasVariants || hasExtras) {
      setSelectedProduct(product);
      setIsProductModalOpen(true);
    } else {
      onSelectProduct(product, undefined, [], "", 1);
      onClose();
    }
  };

  const handleProductModalAdd = (variant?: any, extras?: any[], notes?: string, quantity?: number) => {
    if (selectedProduct) {
      onSelectProduct(selectedProduct, variant, extras, notes, quantity);
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Platillo</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar platillos, bebidas, postres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <Badge
                variant={selectedCategoryId === null ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategoryId(null)}
              >
                Todas
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow bg-card"
                >
                  {product.image_url && (
                    <div className="aspect-square bg-muted">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-primary font-semibold text-sm">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setSelectedProduct(null);
          }}
          onAddToCart={handleProductModalAdd}
        />
      )}
    </>
  );
}