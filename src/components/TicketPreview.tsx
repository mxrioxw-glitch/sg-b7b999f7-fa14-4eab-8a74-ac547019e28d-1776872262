import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download } from "lucide-react";

interface TicketItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  variant?: string;
  extras?: string[];
  notes?: string;
}

interface TicketPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  saleId?: string;
  items: TicketItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  date: Date;
  onPrint?: () => void;
  onConfirm?: () => void;
}

export function TicketPreview({
  open,
  onOpenChange,
  businessName,
  businessAddress,
  businessPhone,
  saleId,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  paymentMethod,
  date,
  onPrint,
  onConfirm,
}: TicketPreviewProps) {
  const formattedDate = date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    const printContent = document.getElementById("ticket-content");
    if (!printContent) return;

    const printWindow = window.open("", "", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${saleId || "Venta"}</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              max-width: 300px;
              margin: 0 auto;
              padding: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .header h2 {
              margin: 0 0 5px 0;
              font-size: 16px;
            }
            .header p {
              margin: 2px 0;
              font-size: 10px;
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .item {
              margin: 8px 0;
            }
            .item-name {
              font-weight: bold;
            }
            .item-details {
              font-size: 10px;
              color: #666;
              margin-left: 10px;
            }
            .item-line {
              display: flex;
              justify-content: space-between;
            }
            .totals {
              margin-top: 10px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total-line.grand {
              font-weight: bold;
              font-size: 14px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    onPrint?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vista Previa del Ticket</DialogTitle>
        </DialogHeader>

        <div id="ticket-content" className="rounded-lg border border-border bg-card p-6 font-mono text-xs">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold">{businessName}</h2>
            {businessAddress && <p className="text-muted-foreground">{businessAddress}</p>}
            {businessPhone && <p className="text-muted-foreground">{businessPhone}</p>}
          </div>

          <Separator className="my-4" />

          {/* Sale Info */}
          <div className="space-y-1 text-muted-foreground">
            {saleId && <p>Ticket: #{saleId.slice(-8).toUpperCase()}</p>}
            <p>Fecha: {formattedDate}</p>
            <p>Método: {paymentMethod}</p>
          </div>

          <Separator className="my-4" />

          {/* Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-semibold">${item.total.toFixed(2)}</span>
                </div>
                {item.variant && (
                  <div className="ml-4 text-muted-foreground">• {item.variant}</div>
                )}
                {item.extras && item.extras.length > 0 && (
                  <div className="ml-4 text-muted-foreground">• {item.extras.join(", ")}</div>
                )}
                {item.notes && (
                  <div className="ml-4 italic text-muted-foreground">Nota: {item.notes}</div>
                )}
                <div className="ml-4 text-muted-foreground">
                  ${item.unitPrice.toFixed(2)} c/u
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({taxRate}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Footer */}
          <div className="text-center text-muted-foreground">
            <p>¡Gracias por su compra!</p>
            <p className="mt-2">Powered by POS SaaS</p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            Confirmar y Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}