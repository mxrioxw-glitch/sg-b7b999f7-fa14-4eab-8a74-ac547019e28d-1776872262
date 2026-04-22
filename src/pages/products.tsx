import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ProductForm } from "@/components/ProductForm";
import { CategoryManager } from "@/components/CategoryManager";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { subscriptionService } from "@/services/subscriptionService";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Tag,
  DollarSign,
  AlertCircle,
  Grid3x3,
  Pencil
} from "lucide-react";
import { requireAuth } from "@/middleware/auth";
import { requireActiveSubscription } from "@/middleware/subscription";
import type { Database } from "@/integrations/supabase/types";
import { GetServerSidePropsContext } from "next";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export const getServerSideProps = requireActiveSubscription;

export default function ProductsPage() {
  return (
    <ProtectedRoute requiredPermission="products" requireWrite>
      <ProductsContent />
    </ProtectedRoute>
  );
}

function ProductsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [businessId, setBusinessId] = useState<string>("");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) {
        router.push("/");
        return;
      }

      setBusinessId(business.id);
      await Promise.all([
        loadProducts(business.id),
        loadCategories(business.id)
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(businessId: string) {
    const data = await productService.getProducts(businessId);
    setProducts(data);
  }

  async function loadCategories(businessId: string) {
    const data = await categoryService.getCategories(businessId);
    setCategories(data);
  }

  function handleDeleteClick(product: Product) {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!productToDelete || !businessId) return;

    setDeleting(productToDelete.id);
    try {
      await productService.deleteProduct(productToDelete.id);
      toast({
        title: "🗑️ Producto eliminado",
        description: productToDelete.name,
        duration: 3000,
      });
      await loadProducts(businessId);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <SEO 
          title="Productos - Nexum Cloud"
          description="Gestión de productos"
        />
        <main className="p-4 md:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Productos</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gestiona el catálogo de productos de tu negocio
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCategoryManager(true)} variant="outline" className="w-full sm:w-auto">
              <Tag className="h-4 w-4 mr-2" />
              Categorías
            </Button>
            <ProductForm 
              onSuccess={() => loadProducts(businessId)}
              trigger={
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              }
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-40 md:h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 md:h-48 bg-muted flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                      {(product as any).category && (
                        <p className="text-xs text-muted-foreground">
                          {(product as any).category.icon} {(product as any).category.name}
                        </p>
                      )}
                    </div>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold text-primary">
                      ${Number(product.base_price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <ProductForm 
                      product={product} 
                      onSuccess={() => loadProducts(businessId)}
                      trigger={
                        <Button size="sm" variant="outline">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all"
                  ? "No se encontraron productos con los filtros aplicados"
                  : "Comienza agregando tu primer producto"}
              </p>
              {!searchQuery && categoryFilter === "all" && (
                <ProductForm 
                  onSuccess={() => loadProducts(businessId)}
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Producto
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Category Manager Dialog */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
          </DialogHeader>
          <CategoryManager
            businessId={businessId}
            categories={categories}
            onRefresh={() => {
              loadCategories(businessId);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  ¿Estás seguro de eliminar "{productToDelete?.name}"?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}