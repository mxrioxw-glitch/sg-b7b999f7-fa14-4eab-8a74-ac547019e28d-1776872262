import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CustomerForm } from "@/components/CustomerForm";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { getCustomers, deleteCustomer, type Customer } from "@/services/customerService";
import { Plus, Search, Edit, Trash2, Users, Star, Phone, Mail } from "lucide-react";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";

export const getServerSideProps = requireActiveSubscription;

export default function CustomersPage() {
  return (
    <ProtectedRoute requiredPermission="customers" requireWrite>
      <CustomersContent />
    </ProtectedRoute>
  );
}

function CustomersContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const business = await businessService.getBusinessByOwnerId(user.id);
      if (!business) {
        router.push("/");
        return;
      }

      setBusinessId(business.id);
      const customersData = await getCustomers(business.id);
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function filterCustomers() {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term)
    );
    setFilteredCustomers(filtered);
  }

  async function handleSaveCustomer(customerData: Omit<Customer, "id" | "created_at" | "updated_at">) {
    if (selectedCustomer) {
      await updateCustomer(selectedCustomer.id, customerData);
    } else {
      await createCustomer(customerData);
    }
    await loadData();
  }

  function handleEditCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setFormOpen(true);
  }

  function handleDeleteClick(customer: Customer) {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete.id);
      toast({
        title: "Customer deleted",
        description: `${customerToDelete.name} has been removed.`,
      });
      await loadData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  }

  async function handleViewDetails(customer: Customer) {
    setDetailCustomer(customer);
    setDetailDialogOpen(true);
    
    try {
      const history = await getCustomerPurchaseHistory(customer.id);
      setPurchaseHistory(history);
    } catch (error) {
      console.error("Error loading purchase history:", error);
      toast({
        title: "Error",
        description: "Failed to load purchase history",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Customers - POS System</title>
      </Head>

      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <FeatureGuard feature="customers">
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Clientes</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Gestiona tu base de clientes y su historial
                </p>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </div>

              {/* Customers Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredCustomers.length > 0 ? (
                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                          <TableHead className="hidden lg:table-cell">Puntos</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {customer.email || "-"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {customer.phone || "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="secondary">
                                {customer.loyalty_points || 0} pts
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDetailCustomer(customer);
                                    setDetailDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No hay clientes</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? "No se encontraron clientes con ese nombre"
                      : "Comienza agregando tu primer cliente"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setFormOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Crear Cliente
                    </Button>
                  )}
                </div>
              )}
            </main>
          </FeatureGuard>
        </div>
      </div>

      {businessId && (
        <CustomerForm
          open={formOpen}
          onOpenChange={setFormOpen}
          customer={selectedCustomer}
          businessId={businessId}
          onSave={handleSaveCustomer}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {detailCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg">{detailCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                  <p className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    {detailCustomer.loyalty_points || 0}
                  </p>
                </div>
                {detailCustomer.email && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg">{detailCustomer.email}</p>
                  </div>
                )}
                {detailCustomer.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-lg">{detailCustomer.phone}</p>
                  </div>
                )}
              </div>

              {detailCustomer.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{detailCustomer.notes}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
                {purchaseHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No purchases yet</p>
                ) : (
                  <div className="space-y-3">
                    {purchaseHistory.map((sale) => (
                      <Card key={sale.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">
                                {new Date(sale.created_at).toLocaleString()}
                              </p>
                              <div className="mt-2 space-y-1">
                                {Array.isArray(sale.sale_items) && sale.sale_items.map((item: any, idx: number) => (
                                  <p key={idx} className="text-sm">
                                    {item.quantity}x {item.product_name}
                                    {item.variant_name && ` (${item.variant_name})`}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <p className="text-lg font-semibold">${Number(sale.total).toFixed(2)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}