import { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import {
  getInventoryItems,
  getInventoryMovements,
} from "@/services/inventoryService";
import { businessService } from "@/services/businessService";
import type { InventoryItem, InventoryMovement } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { inventoryService } from "@/services/inventoryService";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const authResult = await requireAuth(context);
  if ("redirect" in authResult) return authResult;

  const subscriptionResult = await requireActiveSubscription(context);
  if ("redirect" in subscriptionResult) return subscriptionResult;

  return { props: {} };
};

export default function KardexPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      loadMovements(selectedItemId);
    }
  }, [selectedItemId]);

  async function loadItems() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) {
        router.push("/auth/login");
        return;
      }

      const itemsData = await getInventoryItems(business.id);
      setItems(itemsData);

      if (itemsData.length > 0 && !selectedItemId) {
        setSelectedItemId(itemsData[0].id);
      }
    } catch (error) {
      console.error("Error loading items:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements(itemId: string) {
    try {
      const movementsData = await getInventoryMovements(itemId);
      setMovements(movementsData);
    } catch (error) {
      console.error("Error loading movements:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos",
        variant: "destructive",
      });
    }
  }

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      in: "Entrada",
      out: "Salida",
      adjustment: "Ajuste",
    };
    return labels[type] || type;
  };

  const getReferenceTypeLabel = (type: string | null) => {
    if (!type) return "-";
    const labels: Record<string, string> = {
      sale: "Venta",
      purchase: "Compra",
      adjustment: "Ajuste manual",
      production: "Producción",
    };
    return labels[type] || type;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <div className="mb-8">
            <Link href="/inventory">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Inventario
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Kardex de Inventario
            </h1>
            <p className="text-muted">
              Historial de movimientos de inventario
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Movimientos de Inventario</CardTitle>
                  <CardDescription>
                    Selecciona un insumo para ver su historial
                  </CardDescription>
                </div>
                <div className="w-[300px]">
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedItem && (
                <div className="bg-muted/50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Insumo</p>
                      <p className="font-semibold">{selectedItem.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Actual</p>
                      <p className="font-semibold">
                        {Number(selectedItem.current_stock).toFixed(2)} {selectedItem.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Mínimo</p>
                      <p className="font-semibold">
                        {Number(selectedItem.min_stock).toFixed(2)} {selectedItem.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Costo/Unidad</p>
                      <p className="font-semibold">
                        ${Number(selectedItem.cost_per_unit).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted">Cargando movimientos...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted">No hay movimientos registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">
                          {formatDate(movement.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.movement_type === "in"
                                ? "default"
                                : movement.movement_type === "out"
                                ? "destructive"
                                : "outline"
                            }
                            className="gap-1"
                          >
                            {movement.movement_type === "in" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {getMovementTypeLabel(movement.movement_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getReferenceTypeLabel(movement.reference_type)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {movement.movement_type === "in" ? "+" : "-"}
                          {Number(movement.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {movement.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}