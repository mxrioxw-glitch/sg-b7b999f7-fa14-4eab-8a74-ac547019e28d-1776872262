import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";

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

interface CartProps {
  items?: CartItem[];
  taxRate?: number;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCheckout?: () => void;
  className?: string;
}

export function Cart({
  items = [],
  taxRate = 16,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  className,
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  return (
    <Card className={className}>
      <div className="flex items-center gap-2 border-b border-border p-4">
        <ShoppingCart className="h-5 w-5 text-primary" />
        <h2 className="flex-1 text-lg font-bold">Carrito</h2>
        <Badge variant="secondary">{items.length} items</Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay productos en el carrito</p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{item.product.name}</h4>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        Variante: {item.variant.name}
                      </p>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Extras: {item.extras.map(e => e.name).join(", ")}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Notas: {item.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ${item.total.toFixed(2)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 mt-1"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA ({taxRate}%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg">
            <span className="font-bold">Total</span>
            <span className="font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Procesar Pago
        </Button>
      </div>
    </Card>
  );
}