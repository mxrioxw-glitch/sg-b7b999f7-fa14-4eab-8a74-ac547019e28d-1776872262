import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Clock } from "lucide-react";

interface QuickCashRegisterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "open" | "close";
  currentAmount?: number;
  onConfirm: (amount: number, notes: string) => void;
  processing?: boolean;
}

export function QuickCashRegister({
  open,
  onOpenChange,
  mode,
  currentAmount = 0,
  onConfirm,
  processing = false
}: QuickCashRegisterProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) return;
    onConfirm(parsedAmount, notes);
  };

  const handleClose = (open: boolean) => {
    if (!open && !processing) {
      setAmount("");
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {mode === "open" ? "Abrir Turno de Caja" : "Cerrar Turno de Caja"}
          </DialogTitle>
          <DialogDescription>
            {mode === "open"
              ? "Ingresa el monto inicial en efectivo para abrir el turno"
              : "Ingresa el monto final en caja para cerrar el turno"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "close" && currentAmount > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-1">Monto Esperado</p>
              <p className="text-2xl font-bold text-foreground">
                ${currentAmount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Basado en apertura + ventas del turno
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">
              {mode === "open" ? "Monto de Apertura" : "Monto de Cierre"}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-lg h-12"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del turno..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="flex-1"
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={processing || !amount}
            >
              {processing
                ? "Procesando..."
                : mode === "open"
                ? "Abrir Turno"
                : "Cerrar Turno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}