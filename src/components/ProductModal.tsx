import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

interface Variant {
  id: string;
  name: string;
  priceModifier: number;
}

interface Extra {
  id: string;
  name: string;
  price: number;
}

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    basePrice: number;
    image?: string;
    variants?: Variant[];
    extras?: Extra[];
  } | null;
  onAddToCart?: (item: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    extras?: string[];
    notes?: string;
  }) => void;
}

export function ProductModal({ open, onOpenChange, product, onAddToCart }: ProductModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const variant = product.variants?.find((v) => v.id === selectedVariant);
  const basePrice = product.basePrice + (variant?.priceModifier || 0);
  const extrasPrice = selectedExtras.reduce((sum, extraId) => {
    const extra = product.extras?.find((e) => e.id === extraId);
    return sum + (extra?.price || 0);
  }, 0);
  const totalPrice = (basePrice + extrasPrice) * quantity;

  const handleAddToCart = () => {
    onAddToCart?.({
      productId: product.id,
      name: product.name,
      price: basePrice + extrasPrice,
      quantity,
      variant: variant?.name,
      extras: selectedExtras
        .map((id) => product.extras?.find((e) => e.id === id)?.name)
        .filter(Boolean) as string[],
      notes: notes.trim() || undefined,
    });

    setSelectedVariant(null);
    setSelectedExtras([]);
    setNotes("");
    setQuantity(1);
    onOpenChange(false);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraId)
        ? prev.filter((id) => id !== extraId)
        : [...prev, extraId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {product.variants && product.variants.length > 0 && (
            <div>
              <Label className="mb-3 block">Tamaño</Label>
              <div className="grid grid-cols-3 gap-2">
                {product.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant === variant.id ? "default" : "outline"}
                    className="h-auto flex-col gap-1 py-3"
                    onClick={() => setSelectedVariant(variant.id)}
                  >
                    <span className="text-sm font-semibold">{variant.name}</span>
                    <span className="text-xs">
                      {variant.priceModifier > 0 && "+"}${variant.priceModifier.toFixed(2)}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {product.extras && product.extras.length > 0 && (
            <div>
              <Label className="mb-3 block">Extras</Label>
              <div className="space-y-2">
                {product.extras.map((extra) => (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-all hover:bg-accent/50",
                      selectedExtras.includes(extra.id) && "border-accent bg-accent/20"
                    )}
                  >
                    <span className="text-sm font-medium">{extra.name}</span>
                    <Badge variant={selectedExtras.includes(extra.id) ? "default" : "secondary"}>
                      +${extra.price.toFixed(2)}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="mb-2 block">
              Notas especiales (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin azúcar, extra caliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label className="mb-2 block">Cantidad</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-lg font-bold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center justify-between sm:justify-start">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="ml-2 text-2xl font-bold text-primary">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto">
            Agregar al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}