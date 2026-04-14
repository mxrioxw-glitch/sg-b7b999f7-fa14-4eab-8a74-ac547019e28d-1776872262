import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { requireActiveSubscription } from "@/middleware/subscription";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
import { getCashRegisters, getActiveCashRegister, openCashRegister, closeCashRegister, getCashRegisterReport } from "@/services/cashRegisterService";
import { DollarSign, FileText, Calendar, User, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireAuth } from "@/middleware/auth";

export default function CashRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [activeRegister, setActiveRegister] = useState<any | null>(null);
  const [registers, setRegisters] = useState<any[]>([]);
  const [filteredRegisters, setFilteredRegisters] = useState<any[]>([]);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [openForm, setOpenForm] = useState({
    openingAmount: "",
    notes: "",
  });
  const [closeForm, setCloseForm] = useState({
    closingAmount: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRegisters();
  }, [filterStatus, registers]);

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

      const employee = await businessService.getEmployeeByUserId(user.id);
      if (!employee) {
        toast({
          title: "Error",
          description: "Employee profile not found",
          variant: "destructive",
        });
        return;
      }

      setEmployeeId(employee.id);

      const active = await getActiveCashRegister(business.id, employee.id);
      setActiveRegister(active);

      const registersData = await getCashRegisters(business.id);
      setRegisters(registersData);
      setFilteredRegisters(registersData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load cash register data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function filterRegisters() {
    if (filterStatus === "all") {
      setFilteredRegisters(registers);
      return;
    }

    const filtered = registers.filter((reg) => reg.status === filterStatus);
    setFilteredRegisters(filtered);
  }

  async function handleOpenCashRegister() {
    if (!businessId || !employeeId) return;

    try {
      await openCashRegister({
        businessId,
        employeeId,
        openingAmount: parseFloat(openForm.openingAmount),
        notes: openForm.notes || undefined,
      });

      toast({
        title: "Cash register opened",
        description: "Your shift has started successfully.",
      });

      setOpenDialogOpen(false);
      setOpenForm({ openingAmount: "", notes: "" });
      await loadData();
    } catch (error: any) {
      console.error("Error opening cash register:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open cash register",
        variant: "destructive",
      });
    }
  }

  async function handleCloseCashRegister() {
    if (!activeRegister) return;

    try {
      await closeCashRegister({
        registerId: activeRegister.id,
        closingAmount: parseFloat(closeForm.closingAmount),
        notes: closeForm.notes || undefined,
      });

      toast({
        title: "Cash register closed",
        description: "Your shift has been closed successfully.",
      });

      setCloseDialogOpen(false);
      setCloseForm({ closingAmount: "", notes: "" });
      await loadData();
    } catch (error) {
      console.error("Error closing cash register:", error);
      toast({
        title: "Error",
        description: "Failed to close cash register",
        variant: "destructive",
      });
    }
  }

  async function handleViewReport(register: any) {
    try {
      const report = await getCashRegisterReport(register.id);
      setSelectedReport(report);
      setReportDialogOpen(true);
    } catch (error) {
      console.error("Error loading report:", error);
      toast({
        title: "Error",
        description: "Failed to load cash register report",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading cash register...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Cash Register - POS System</title>
      </Head>

      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Cash Register</h1>
                  <p className="text-muted-foreground mt-2">Manage your cash register shifts</p>
                </div>
                {activeRegister ? (
                  <Button onClick={() => setCloseDialogOpen(true)} size="lg" variant="destructive">
                    <XCircle className="h-5 w-5 mr-2" />
                    Close Register
                  </Button>
                ) : (
                  <Button onClick={() => setOpenDialogOpen(true)} size="lg">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Open Register
                  </Button>
                )}
              </div>

              {activeRegister && (
                <Card className="border-accent bg-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-accent" />
                      Active Shift
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Opened At</p>
                        <p className="text-lg font-semibold">
                          {new Date(activeRegister.opened_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Opening Amount</p>
                        <p className="text-lg font-semibold">
                          ${Number(activeRegister.opening_amount).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className="bg-accent text-accent-foreground">
                          {activeRegister.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {activeRegister.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{activeRegister.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 items-center">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Shift History</h2>
                {filteredRegisters.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground">No shifts found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRegisters.map((register) => {
                    const employee = register.employees as any;
                    const profile = employee?.profiles;
                    
                    return (
                      <Card key={register.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-3">
                                <Badge variant={register.status === "open" ? "default" : "secondary"}>
                                  {register.status}
                                </Badge>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {profile?.full_name || profile?.email || "Unknown"}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Opened</p>
                                  <p className="font-medium">
                                    {new Date(register.opened_at).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(register.opened_at).toLocaleTimeString()}
                                  </p>
                                </div>

                                {register.closed_at && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">Closed</p>
                                    <p className="font-medium">
                                      {new Date(register.closed_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(register.closed_at).toLocaleTimeString()}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm text-muted-foreground">Opening Amount</p>
                                  <p className="font-medium text-lg">
                                    ${Number(register.opening_amount).toFixed(2)}
                                  </p>
                                </div>

                                {register.status === "closed" && (
                                  <>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Closing Amount</p>
                                      <p className="font-medium text-lg">
                                        ${Number(register.closing_amount || 0).toFixed(2)}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>

                              {register.status === "closed" && register.difference !== null && (
                                <div className="flex items-center gap-4 pt-2 border-t">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Expected</p>
                                    <p className="font-medium">
                                      ${Number(register.expected_amount || 0).toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Difference</p>
                                    <p className={`font-medium text-lg ${
                                      Number(register.difference) === 0
                                        ? "text-accent"
                                        : Number(register.difference) > 0
                                        ? "text-blue-600"
                                        : "text-destructive"
                                    }`}>
                                      {Number(register.difference) > 0 ? "+" : ""}
                                      ${Number(register.difference).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <Button variant="outline" onClick={() => handleViewReport(register)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Report
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Open Cash Register</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="openingAmount">Opening Amount *</Label>
              <Input
                id="openingAmount"
                type="number"
                step="0.01"
                value={openForm.openingAmount}
                onChange={(e) => setOpenForm({ ...openForm, openingAmount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="openNotes">Notes (Optional)</Label>
              <Textarea
                id="openNotes"
                value={openForm.notes}
                onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })}
                placeholder="Any notes about this shift..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenCashRegister} disabled={!openForm.openingAmount}>
              Open Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Close Cash Register</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="closingAmount">Closing Amount *</Label>
              <Input
                id="closingAmount"
                type="number"
                step="0.01"
                value={closeForm.closingAmount}
                onChange={(e) => setCloseForm({ ...closeForm, closingAmount: e.target.value })}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Count the cash in the register and enter the total amount
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeNotes">Notes (Optional)</Label>
              <Textarea
                id="closeNotes"
                value={closeForm.notes}
                onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })}
                placeholder="Any notes about this closing..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseCashRegister} disabled={!closeForm.closingAmount} variant="destructive">
              Close Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cash Register Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee</p>
                  <p className="text-lg">
                    {selectedReport.employees?.profiles?.full_name || 
                     selectedReport.employees?.profiles?.email || 
                     "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={selectedReport.status === "open" ? "default" : "secondary"}>
                    {selectedReport.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Opened At</p>
                  <p className="text-lg">{new Date(selectedReport.opened_at).toLocaleString()}</p>
                </div>
                {selectedReport.closed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Closed At</p>
                    <p className="text-lg">{new Date(selectedReport.closed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-lg">Financial Summary</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Opening Amount</p>
                      <p className="text-2xl font-bold">
                        ${Number(selectedReport.opening_amount).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold text-accent">
                        ${Number(selectedReport.totalSales).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  {selectedReport.status === "closed" && (
                    <>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Expected Amount</p>
                          <p className="text-2xl font-bold">
                            ${Number(selectedReport.expected_amount || 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Closing Amount</p>
                          <p className="text-2xl font-bold">
                            ${Number(selectedReport.closing_amount || 0).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="col-span-2">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Difference</p>
                          <p className={`text-3xl font-bold ${
                            Number(selectedReport.difference) === 0
                              ? "text-accent"
                              : Number(selectedReport.difference) > 0
                              ? "text-blue-600"
                              : "text-destructive"
                          }`}>
                            {Number(selectedReport.difference) > 0 ? "+" : ""}
                            ${Number(selectedReport.difference).toFixed(2)}
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Transaction Count</p>
                    <p className="text-2xl font-bold">{selectedReport.transactionCount}</p>
                  </CardContent>
                </Card>
              </div>

              {selectedReport.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}