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
  businessLogo?: string;
  saleId?: string;
  items: TicketItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  date: Date;
  printerWidth?: "58mm" | "80mm";
  onPrint?: () => void;
  onConfirm?: () => void;
}

export function TicketPreview({
  open,
  onOpenChange,
  businessName,
  businessAddress,
  businessPhone,
  businessLogo,
  saleId,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  paymentMethod,
  date,
  printerWidth = "80mm",
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

    const ticketWidth = printerWidth === "58mm" ? "200px" : "280px";
    const fontSize = printerWidth === "58mm" ? "10px" : "12px";
    const headerFontSize = printerWidth === "58mm" ? "14px" : "16px";
    const logoSize = printerWidth === "58mm" ? "60px" : "80px";

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${saleId || "Venta"}</title>
          <style>
            @page {
              size: ${printerWidth};
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: ${fontSize};
              max-width: ${ticketWidth};
              margin: 0 auto;
              padding: 10px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .logo {
              max-width: ${logoSize};
              max-height: ${logoSize};
              margin: 0 auto 8px;
              display: block;
            }
            .header h2 {
              margin: 0 0 5px 0;
              font-size: ${headerFontSize};
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              font-size: ${printerWidth === "58mm" ? "9px" : "10px"};
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            .info {
              font-size: ${printerWidth === "58mm" ? "9px" : "10px"};
              margin-bottom: 8px;
            }
            .info p {
              margin: 2px 0;
            }
            .item {
              margin: 8px 0;
            }
            .item-name {
              font-weight: bold;
              display: flex;
              justify-content: space-between;
            }
            .item-details {
              font-size: ${printerWidth === "58mm" ? "9px" : "10px"};
              color: #333;
              margin-left: 10px;
              margin-top: 2px;
            }
            .totals {
              margin-top: 10px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
            }
            .total-line.grand {
              font-weight: bold;
              font-size: ${printerWidth === "58mm" ? "12px" : "14px"};
              margin-top: 8px;
              border-top: 2px solid #000;
              padding-top: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: ${printerWidth === "58mm" ? "9px" : "10px"};
            }
            .footer p {
              margin: 3px 0;
            }
            @media print {
              body { 
                margin: 0;
                padding: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${businessLogo ? `<img src="${businessLogo}" alt="Logo" class="logo" />` : ''}
            <h2>${businessName}</h2>
            ${businessAddress ? `<p>${businessAddress}</p>` : ''}
            ${businessPhone ? `<p>${businessPhone}</p>` : ''}
          </div>
          <div class="separator"></div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      onPrint?.();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vista Previa del Ticket</DialogTitle>
        </DialogHeader>

        <div 
          id="ticket-content" 
          className="rounded-lg border border-border bg-white p-4 font-mono"
          style={{ 
            maxWidth: printerWidth === "58mm" ? "200px" : "280px",
            fontSize: printerWidth === "58mm" ? "10px" : "12px",
            margin: "0 auto"
          }}
        >
          {/* Header */}
          <div className="text-center mb-3">
            {businessLogo && (
              <img
                src={businessLogo}
                alt="Logo"
                className="mx-auto mb-2 object-contain"
                style={{
                  maxWidth: printerWidth === "58mm" ? "60px" : "80px",
                  maxHeight: printerWidth === "58mm" ? "60px" : "80px"
                }}
              />
            )}
            <h2 
              className="font-bold mb-1"
              style={{ fontSize: printerWidth === "58mm" ? "14px" : "16px" }}
            >
              {businessName}
            </h2>
            {businessAddress && (
              <p className="text-muted-foreground" style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}>
                {businessAddress}
              </p>
            )}
            {businessPhone && (
              <p className="text-muted-foreground" style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}>
                {businessPhone}
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Sale Info */}
          <div className="space-y-1 mb-3" style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}>
            {saleId && <p>Ticket: #{saleId.slice(-8).toUpperCase()}</p>}
            <p>Fecha: {formattedDate}</p>
            <p>Método: {paymentMethod}</p>
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between font-semibold">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${item.total.toFixed(2)}</span>
                </div>
                {item.variant && (
                  <div 
                    className="ml-3 text-muted-foreground"
                    style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}
                  >
                    • {item.variant}
                  </div>
                )}
                {item.extras && item.extras.length > 0 && (
                  <div 
                    className="ml-3 text-muted-foreground"
                    style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}
                  >
                    • {item.extras.join(", ")}
                  </div>
                )}
                {item.notes && (
                  <div 
                    className="ml-3 italic text-muted-foreground"
                    style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}
                  >
                    Nota: {item.notes}
                  </div>
                )}
                <div 
                  className="ml-3 text-muted-foreground"
                  style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}
                >
                  ${item.unitPrice.toFixed(2)} c/u
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border my-2" />

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
            <div className="border-t-2 border-border my-2" />
            <div 
              className="flex justify-between font-bold"
              style={{ fontSize: printerWidth === "58mm" ? "12px" : "14px" }}
            >
              <span>TOTAL</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border my-2" />

          {/* Footer */}
          <div 
            className="text-center text-muted-foreground"
            style={{ fontSize: printerWidth === "58mm" ? "9px" : "10px" }}
          >
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