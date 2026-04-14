import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerForm } from "@/components/CustomerForm";
import { useToast } from "@/hooks/use-toast";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";
import { getBusinessByOwnerId } from "@/services/businessService";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerPurchaseHistory, type Customer } from "@/services/customerService";
import { Plus, Search, Mail, Phone, Star, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Customers() {
  const router = useRouter();
  const { toast } = useToast();
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
      const business = await getBusinessByOwnerId();
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

      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Customers</h1>
                  <p className="text-muted-foreground mt-2">Manage your customer database</p>
                </div>
                <Button onClick={() => { setSelectedCustomer(null); setFormOpen(true); }} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  New Customer
                </Button>
              </div>

              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {filteredCustomers.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">
                        {searchTerm ? "No customers found matching your search" : "No customers yet"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredCustomers.map((customer) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-semibold">{customer.name}</h3>
                              {customer.loyalty_points && customer.loyalty_points > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {customer.loyalty_points} points
                                </Badge>
                              )}
                            </div>

                            <div className="mt-4 space-y-2">
                              {customer.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  <span className="text-sm">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  <span className="text-sm">{customer.phone}</span>
                                </div>
                              )}
                              {customer.notes && (
                                <p className="text-sm text-muted-foreground mt-2">{customer.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(customer)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)}>
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteClick(customer)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </main>
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

export const getServerSideProps = requireAuth(requireActiveSubscription());