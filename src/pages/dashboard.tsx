import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getDashboardMetrics, type DashboardMetrics } from "@/services/dashboardService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
import { FeatureGuard } from "@/components/FeatureGuard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";

export const getServerSideProps = requireActiveSubscription;

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("Mi Negocio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (business) {
        setBusinessName(business.name || "Mi Negocio");
        const dashboardStats = await dashboardService.getDashboardStats(business.id);
        setStats(dashboardStats);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SEO 
        title="Dashboard - Nexum Cloud"
        description="Panel de control de Nexum Cloud"
      />
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
      </div>
    </ProtectedRoute>
  );
}