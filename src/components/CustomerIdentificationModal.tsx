import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, SkipForward } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  points: number;
}

interface CustomerIdentificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onContinue: (customerId: string | null) => void;
}

export function CustomerIdentificationModal({
  open,
  onOpenChange,
  customers,
  onContinue,
}: CustomerIdentificationModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const handleContinueWithCustomer = () => {
    onContinue(selectedCustomer || null);
  };

  const handleSkip = () => {
    onContinue(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Identificar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{customer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({customer.points} pts)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer && (
            <div className="rounded-lg bg-accent/10 p-4 border border-accent/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {customers.find(c => c.id === selectedCustomer)?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Puntos actuales: {customers.find(c => c.id === selectedCustomer)?.points || 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Ganará puntos</p>
                  <p className="text-lg font-bold text-accent">+pts</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            className="flex-1 sm:flex-none"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Omitir (Sin Cliente)
          </Button>
          <Button
            onClick={handleContinueWithCustomer}
            disabled={!selectedCustomer}
            className="flex-1 sm:flex-none"
          >
            Continuar a Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}