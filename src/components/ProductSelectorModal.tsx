import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Minus, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProducts: (products: any[]) => Promise<void>;
  products: any[];
  categories: any[];
}

export function ProductSelectorModal({
  open,
  onClose,
  onSelectProducts,
  products,
  categories,
}: ProductSelectorModalProps) {
  const { toast } = useToast();
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedProducts(new Map());
      setFilteredProducts(products.filter(p => p.is_active));
    }
  }, [open, products]);

  useEffect(() => {
    const activeProducts = products.filter(p => p.is_active);
    if (searchQuery.trim() === "") {
      setFilteredProducts(activeProducts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        activeProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.category?.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  function handleAddProduct(product: any) {
    const key = `${product.id}-${product.selectedVariant?.id || 'base'}`;
    const existing = selectedProducts.get(key);

    if (existing) {
      const updated = { ...existing, quantity: existing.quantity + 1 };
      setSelectedProducts(new Map(selectedProducts.set(key, updated)));
    } else {
      const basePrice = product.selectedVariant?.price || product.base_price || 0;
      
      setSelectedProducts(
        new Map(
          selectedProducts.set(key, {
            ...product,
            quantity: 1,
            finalPrice: basePrice,
            notes: "",
          })
        )
      );
    }
  }

  function handleRemoveProduct(product: any) {
    const key = `${product.id}-${product.selectedVariant?.id || 'base'}`;
    const existing = selectedProducts.get(key);

    if (existing && existing.quantity > 1) {
      const updated = { ...existing, quantity: existing.quantity - 1 };
      setSelectedProducts(new Map(selectedProducts.set(key, updated)));
    } else {
      const newMap = new Map(selectedProducts);
      newMap.delete(key);
      setSelectedProducts(newMap);
    }
  }

  function getProductQuantity(product: any) {
    const key = `${product.id}-${product.selectedVariant?.id || 'base'}`;
    return selectedProducts.get(key)?.quantity || 0;
  }

  async function handleConfirm() {
    const productsArray = Array.from(selectedProducts.values());
    
    if (productsArray.length === 0) {
      toast({
        title: "ℹ️ Sin productos",
        description: "Selecciona al menos un producto",
      });
      return;
    }

    try {
      await onSelectProducts(productsArray);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "❌ Error",
        description: error.message || "No se pudieron agregar los productos",
        variant: "destructive",
      });
    }
  }

  const totalItems = Array.from(selectedProducts.values()).reduce(
    (sum, p) => sum + p.quantity,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Seleccionar Productos</DialogTitle>
        </VisuallyHidden>
        <DialogHeader className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Seleccionar Productos</h2>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 px-6">
          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full py-12">
              <p className="text-muted-foreground">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
              {filteredProducts.map((product) => {
                const quantity = getProductQuantity(product);
                const price = product.base_price || 0;

                return (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-4 flex flex-col gap-2 transition-all ${
                      quantity > 0 ? "border-accent ring-2 ring-accent/20" : ""
                    }`}
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      {product.category && (
                        <Badge variant="outline" className="mt-1">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-semibold text-accent">
                        ${price.toFixed(2)}
                      </span>

                      {quantity === 0 ? (
                        <Button
                          size="sm"
                          onClick={() => handleAddProduct(product)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveProduct(product)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddProduct(product)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">
              {totalItems} {totalItems === 1 ? "producto" : "productos"} seleccionados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={totalItems === 0}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}