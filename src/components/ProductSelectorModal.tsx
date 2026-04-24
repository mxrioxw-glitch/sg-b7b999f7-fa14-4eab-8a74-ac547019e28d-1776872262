import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onSelect: (product: any) => void;
}

export function ProductSelectorModal({ isOpen, onClose, products, onSelect }: ProductSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Seleccionar Platillo</DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar platillos, bebidas, postres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
                onClick={() => onSelect(product)}
              >
                {product.image_url ? (
                  <div className="aspect-square w-full relative bg-muted">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square w-full bg-muted/30 flex items-center justify-center border-b">
                    <span className="text-muted-foreground/50 text-5xl font-bold uppercase">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                )}
                <CardContent className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="mt-auto">
                    <Badge variant="secondary" className="font-semibold">
                      ${Number(product.base_price).toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm">Intenta con otra búsqueda</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}