import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Check, Trash2 } from "lucide-react";
import { ProductModal } from "@/components/ProductModal";

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: any, variant?: any, extras?: any[], notes?: string, quantity?: number) => void;
  products: any[];
  categories: any[];
}

interface AddedProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variantName?: string;
  extras?: any[];
  notes?: string;
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
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);

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
    // Calcular precio final
    const basePrice = variant?.price || product.price || 0;
    const extrasPrice = extras?.reduce((sum, extra) => sum + (extra.price || 0), 0) || 0;
    const finalPrice = basePrice + extrasPrice;

    // Agregar a la lista de productos agregados
    const newProduct: AddedProduct = {
      id: `${product.id}-${Date.now()}`, // ID único para cada adición
      name: product.name,
      price: finalPrice,
      quantity: quantity || 1,
      variantName: variant?.name,
      extras,
      notes,
    };

    setAddedProducts(prev => [...prev, newProduct]);

    // Enviar al callback original
    onSelectProduct(product, variant, extras, notes, quantity);

    // IMPORTANTE: NO cerramos el modal - el usuario puede seguir agregando
    setShowProductModal(false);
    setSelectedProduct(null);
  }

  function handleRemoveProduct(productId: string) {
    setAddedProducts(prev => prev.filter(p => p.id !== productId));
  }

  function handleClose() {
    setSearchQuery("");
    setSelectedCategory(null);
    setAddedProducts([]);
    onClose();
  }

  const totalProducts = addedProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = addedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent side="bottom" className="h-[95vh] p-0 flex flex-col">
          <div className="flex h-full">
            {/* Left Sidebar - Added Products */}
            <div className="w-80 border-r flex flex-col bg-muted/30">
              <div className="px-4 py-4 border-b bg-background">
                <h3 className="font-semibold text-lg mb-1">Productos Agregados</h3>
                {addedProducts.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground">${totalAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {addedProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Aún no has agregado productos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selecciona productos del menú
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-background border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            {product.variantName && (
                              <p className="text-xs text-muted-foreground">
                                {product.variantName}
                              </p>
                            )}
                            {product.extras && product.extras.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                +{product.extras.map(e => e.name).join(', ')}
                              </p>
                            )}
                            {product.notes && (
                              <p className="text-xs text-muted-foreground italic">
                                "{product.notes}"
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Cantidad: {product.quantity}
                          </span>
                          <span className="font-semibold">
                            ${(product.price * product.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Product Selection */}
            <div className="flex-1 flex flex-col">
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

                {addedProducts.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default" className="bg-accent text-accent-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      {totalProducts} {totalProducts === 1 ? "producto agregado" : "productos agregados"}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => {
                      const basePrice = product.variants && product.variants.length > 0 
                        ? product.variants[0].price 
                        : product.price;
                      
                      return (
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
                              ${Number(basePrice || 0).toFixed(2)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <SheetFooter className="px-6 py-4 border-t flex-shrink-0">
                <Button
                  onClick={handleClose}
                  size="lg"
                  className="w-full"
                  disabled={addedProducts.length === 0}
                >
                  {addedProducts.length === 0 
                    ? "Selecciona al menos un producto" 
                    : `Continuar con ${totalProducts} ${totalProducts === 1 ? 'producto' : 'productos'} ($${totalAmount.toFixed(2)})`
                  }
                </Button>
              </SheetFooter>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Product Configuration Modal */}
      <ProductModal
        open={showProductModal}
        onOpenChange={(open) => {
          setShowProductModal(open);
          if (!open) setSelectedProduct(null);
        }}
        onAddToCart={handleProductSelect}
        product={selectedProduct}
      />
    </>
  );
}