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

      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-3 p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Carrito vacío
              </p>
              <p className="text-xs text-muted-foreground">
                Agrega productos para comenzar
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{item.name}</h3>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">{item.variant}</p>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        + {item.extras.join(", ")}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs italic text-muted-foreground">
                        Nota: {item.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemoveItem?.(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity?.(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
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