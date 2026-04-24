import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  categories = [],
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

  function handleProductClick(product: any) {
    const hasVariants = product.variants && product.variants.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;

    if (hasVariants || hasExtras) {
      // Transform product to match ProductModal expected structure
      const transformedProduct = {
        ...product,
        basePrice: product.price || 0,
        image: product.image_url,
        name: product.name,
        category: product.category,
        variants: product.variants || [],
        extras: product.extras || [],
      };
      setSelectedProduct(transformedProduct);
      setIsProductModalOpen(true);
    } else {
      // Direct add without modal
      onSelectProduct(product, undefined, [], "", 1);
      onClose();
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Seleccionar Platillo</DialogTitle>
          </DialogHeader>

          <div className="p-4 border-b flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar platillos, bebidas, postres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all hover:border-primary/50 bg-card flex flex-col h-full"
                >
                  {product.image_url ? (
                    <div className="aspect-[4/3] bg-muted relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">Sin imagen</span>
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-lg font-bold text-primary">
                      ${(product.price || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
                <Search className="h-8 w-8 mb-3 opacity-20" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedProduct && (
        <ProductModal
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            basePrice: selectedProduct.price,
            image: selectedProduct.image_url,
            variants: selectedProduct.variants,
            extras: selectedProduct.extras
          }}
          open={isProductModalOpen}
          onOpenChange={(open) => {
            setIsProductModalOpen(open);
            if (!open) setSelectedProduct(null);
          }}
          onAddToCart={(item) => {
            onSelectProduct(selectedProduct, item.variant, item.extras, item.notes, item.quantity);
            setIsProductModalOpen(false);
            setSelectedProduct(null);
            onClose();
          }}
        />
      )}
    </>
  );
}