import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Tamaño</h3>
              <div className="grid grid-cols-3 gap-2">
                {product.variants.map((variant) => {
                  const variantPrice = (product.basePrice || 0) + (variant.priceModifier || 0);
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedVariant === variant.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium text-sm">{variant.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {variant.priceModifier && variant.priceModifier !== 0
                          ? `${variant.priceModifier > 0 ? "+" : ""}$${variant.priceModifier.toFixed(2)}`
                          : `$${variantPrice.toFixed(2)}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras - con scroll interno si hay muchos */}
          {product.extras && product.extras.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Extras</h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 -mr-2">
                {product.extras.map((extra) => (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      selectedExtras.includes(extra.id)
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <span className="font-medium text-sm">{extra.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      +${(extra.price || 0).toFixed(2)}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notas especiales */}
          <div className="mb-6">
            <label className="font-semibold block mb-3">
              Notas especiales (opcional)
            </label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin azúcar, extra caliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Cantidad */}
          <div className="mb-6">
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

        {/* Footer sticky */}
        <div className="border-t bg-background p-6 pt-4">
          <Button
            onClick={handleAddToCart}
            className="w-full h-12 text-lg"
            size="lg"
          >
            Agregar al carrito - ${totalPrice.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}