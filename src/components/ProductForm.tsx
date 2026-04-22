import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload, X, DollarSign, Tag, Package, Sparkles, Info, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { businessService } from "@/services/businessService";
import { storageService } from "@/services/storageService";
import { getInventoryItems } from "@/services/inventoryService";
import { subscriptionService } from "@/services/subscriptionService";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Category = Tables<"categories">;
type InventoryItem = Tables<"inventory_items">;

interface ProductFormProps {
  product?: Product | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface VariantForm {
  id?: string;
  name: string;
  price_modifier: number;
  sort_order: number;
  inventory_links: {
    id?: string;
    inventory_item_id: string;
    quantity_per_unit: number;
  }[];
  ingredients?: Array<{
    inventory_id: string;
    quantity: number;
    inventory_name?: string;
  }>;
  price?: number;
}

interface ExtraForm {
  id?: string;
  name: string;
  price: number;
  sort_order: number;
  ingredients?: Array<{
    inventory_id: string;
    quantity: number;
    inventory_name?: string;
  }>;
}

interface ProductInventoryLink {
  id?: string;
  inventory_item_id: string;
  quantity_per_unit: number;
}

export function ProductForm({ product, onSuccess, trigger }: ProductFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  // Form data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [hasExtras, setHasExtras] = useState(false);
  const [generatesPoints, setGeneratesPoints] = useState(false);
  const [pointsValue, setPointsValue] = useState(0);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [extras, setExtras] = useState<ExtraForm[]>([]);
  const [productInventoryLinks, setProductInventoryLinks] = useState<ProductInventoryLink[]>([]);
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"basic" | "professional" | "premium">("basic");
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (product && open) {
      setName(product.name || "");
      setDescription(product.description || "");
      setCategoryId(product.category_id || "");
      setBasePrice(Number(product.base_price) || 0);
      setImageUrl(product.image_url || "");
      setPreviewUrl(product.image_url || "");
      setIsActive(product.is_active ?? true);
      setHasVariants(product.has_variants || false);
      setHasExtras(product.has_extras || false);
      setGeneratesPoints(product.generates_points || false);
      setPointsValue(product.points_value || 0);
      loadProductDetails();
    } else if (open) {
      resetForm();
    }
  }, [product, open]);

  function resetForm() {
    setName("");
    setDescription("");
    setCategoryId("");
    setBasePrice(0);
    setImageUrl("");
    setPreviewUrl("");
    setIsActive(true);
    setHasVariants(false);
    setHasExtras(false);
    setGeneratesPoints(false);
    setPointsValue(0);
    setVariants([]);
    setExtras([]);
    setProductInventoryLinks([]);
    setImageFile(null);
  }

  async function loadInitialData() {
    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) return;

      const [categoriesData, inventoryData] = await Promise.all([
        categoryService.getCategories(business.id),
        getInventoryItems(business.id)
      ]);

      setCategories(categoriesData);
      setInventoryItems(inventoryData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function loadProductDetails() {
    if (!product) return;

    try {
      const [variantsData, extrasData, linksData] = await Promise.all([
        productService.getProductVariants(product.id),
        productService.getProductExtras(product.id),
        loadProductInventoryLinks(product.id),
      ]);

      const variantsWithInventory = await Promise.all(
        variantsData.map(async (v) => {
          const { data: variantLinks } = await supabase
            .from("product_inventory_items")
            .select("*")
            .eq("product_id", product.id)
            .eq("variant_id", v.id);

          return {
            id: v.id,
            name: v.name,
            price: Number(v.price_modifier),
            price_modifier: Number(v.price_modifier),
            sort_order: v.sort_order || 0,
            inventory_links: (variantLinks || []).map((link) => ({
              id: link.id,
              inventory_item_id: link.inventory_item_id,
              quantity_per_unit: Number(link.quantity_per_unit),
            })),
            ingredients: (variantLinks || []).map((link) => ({
              inventory_id: link.inventory_item_id,
              quantity: Number(link.quantity_per_unit),
            })),
          };
        })
      );

      setVariants(variantsWithInventory);
      setExtras(
        extrasData.map((e) => ({
          id: e.id,
          name: e.name,
          price: Number(e.price),
          sort_order: e.sort_order || 0,
        }))
      );
      setProductInventoryLinks(linksData);
    } catch (error) {
      console.error("Error loading product details:", error);
    }
  }

  async function loadProductInventoryLinks(productId: string): Promise<ProductInventoryLink[]> {
    const { data, error } = await supabase
      .from("product_inventory_items")
      .select("*")
      .eq("product_id", productId)
      .is("variant_id", null);

    if (error) {
      console.error("Error loading product inventory links:", error);
      return [];
    }

    return (
      data?.map((link) => ({
        id: link.id,
        inventory_item_id: link.inventory_item_id,
        quantity_per_unit: Number(link.quantity_per_unit),
      })) || []
    );
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;

    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) return;

      const { category, error } = await categoryService.createCategory(business.id, {
        name: newCategoryName,
      });

      if (error || !category) {
        toast({
          title: "Error",
          description: "No se pudo crear la categoría",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Categoría creada",
        description: `La categoría "${newCategoryName}" se creó correctamente`,
      });

      setCategoryId(category.id);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      await loadInitialData();
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageUrl("");
    setPreviewUrl("");
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  async function uploadImageToStorage(businessId: string): Promise<string> {
    if (!imageFile) return imageUrl;

    try {
      const { url } = await storageService.uploadProductImage(imageFile, businessId);
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!product) {
      const canAdd = await subscriptionService.canAddProduct();
      if (!canAdd.canAdd) {
        const plan = await subscriptionService.getCurrentPlan();
        setCurrentPlan(plan as "basic" | "professional" | "premium");

        const business = await businessService.getCurrentBusiness();
        if (business) {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("business_id", business.id);

          setProductCount(count || 0);
        }

        setShowUpgradeModal(true);
        return;
      }
    }

    setLoading(true);

    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) throw new Error("No business found");

      const finalImageUrl = await uploadImageToStorage(business.id);

      const productData = {
        category_id: categoryId || undefined,
        name,
        description,
        base_price: basePrice,
        image_url: finalImageUrl || undefined,
        has_variants: hasVariants,
        has_extras: hasExtras,
        generates_points: generatesPoints,
        points_value: generatesPoints ? pointsValue : 0,
        is_active: isActive,
      };

      let savedProduct: Product;
      if (product) {
        const result = await productService.updateProduct(product.id, productData);
        if (result.error || !result.product) throw new Error(result.error || "Error");
        savedProduct = result.product;
      } else {
        const result = await productService.createProduct(business.id, productData);
        if (result.error || !result.product) throw new Error(result.error || "Error");
        savedProduct = result.product;
      }

      // Save variants
      if (hasVariants) {
        const existingVariants = await productService.getProductVariants(savedProduct.id);
        const existingIds = existingVariants.map((v) => v.id);

        for (const variant of variants) {
          let variantId = variant.id;

          if (variant.id && existingIds.includes(variant.id)) {
            await productService.updateProductVariant(variant.id, {
              name: variant.name,
              price_modifier: variant.price !== undefined ? variant.price : variant.price_modifier,
              sort_order: variant.sort_order,
            });
          } else {
            const { variant: newVariant } = await productService.createVariant(savedProduct.id, {
              name: variant.name,
              price_modifier: variant.price !== undefined ? variant.price : variant.price_modifier,
              sort_order: variant.sort_order,
            });
            variantId = newVariant?.id;
          }

          if (variantId) {
            const { data: existingLinks } = await supabase
              .from("product_inventory_items")
              .select("*")
              .eq("product_id", savedProduct.id)
              .eq("variant_id", variantId);

            const linksToSave = variant.ingredients && variant.ingredients.length > 0
              ? variant.ingredients.map((ing) => ({
                  inventory_item_id: ing.inventory_id,
                  quantity_per_unit: ing.quantity,
                  id: undefined,
                }))
              : variant.inventory_links || [];

            for (const link of linksToSave) {
              if (!link.inventory_item_id) continue;

              const existingLink = existingLinks?.find((l) => l.inventory_item_id === link.inventory_item_id);

              if (existingLink) {
                await supabase
                  .from("product_inventory_items")
                  .update({ quantity_per_unit: link.quantity_per_unit })
                  .eq("id", existingLink.id);
              } else {
                await supabase.from("product_inventory_items").insert({
                  product_id: savedProduct.id,
                  variant_id: variantId,
                  inventory_item_id: link.inventory_item_id,
                  quantity_per_unit: link.quantity_per_unit,
                });
              }
            }

            const linkItemIds = linksToSave.map((l) => l.inventory_item_id).filter(Boolean);
            const toDeleteLinks = existingLinks?.filter((l) => !linkItemIds.includes(l.inventory_item_id)) || [];

            for (const link of toDeleteLinks) {
              await supabase.from("product_inventory_items").delete().eq("id", link.id);
            }
          }
        }

        const variantIds = variants.filter((v) => v.id).map((v) => v.id);
        const toDelete = existingIds.filter((id) => !variantIds.includes(id));
        for (const id of toDelete) {
          await productService.deleteProductVariant(id);
        }
      }

      // Save extras
      if (hasExtras) {
        const existingExtras = await productService.getProductExtras(savedProduct.id);
        const existingIds = existingExtras.map((e) => e.id);

        for (const extra of extras) {
          if (extra.id && existingIds.includes(extra.id)) {
            await productService.updateProductExtra(extra.id, {
              name: extra.name,
              price: extra.price,
              sort_order: extra.sort_order,
            });
          } else {
            await productService.createExtra(savedProduct.id, {
              name: extra.name,
              price: extra.price,
              sort_order: extra.sort_order,
            });
          }
        }

        const extraIds = extras.filter((e) => e.id).map((e) => e.id);
        const toDelete = existingIds.filter((id) => !extraIds.includes(id));
        for (const id of toDelete) {
          await productService.deleteProductExtra(id);
        }
      }

      // Save inventory links
      const existingLinks = await loadProductInventoryLinks(savedProduct.id);
      const existingLinkIds = existingLinks.map((l) => l.id).filter(Boolean);

      for (const link of productInventoryLinks) {
        if (!link.inventory_item_id) continue;

        if (link.id && existingLinkIds.includes(link.id)) {
          await supabase
            .from("product_inventory_items")
            .update({ quantity_per_unit: link.quantity_per_unit })
            .eq("id", link.id);
        } else {
          await supabase.from("product_inventory_items").insert({
            product_id: savedProduct.id,
            variant_id: null,
            inventory_item_id: link.inventory_item_id,
            quantity_per_unit: link.quantity_per_unit,
          });
        }
      }

      const linkInventoryIds = productInventoryLinks.filter((l) => l.id).map((l) => l.id);
      const toDeleteLinks = existingLinkIds.filter((id) => !linkInventoryIds.includes(id));
      for (const id of toDeleteLinks) {
        await supabase.from("product_inventory_items").delete().eq("id", id);
      }

      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: product 
          ? "El producto se actualizó correctamente" 
          : "El producto se creó correctamente",
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-2xl font-bold">
              {product ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {product 
                ? "Modifica la información del producto" 
                : "Completa la información para crear un nuevo producto"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="basic" className="text-xs md:text-sm">
                      <Info className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Información</span>
                      <span className="sm:hidden">Info</span>
                    </TabsTrigger>
                    <TabsTrigger value="variants" className="text-xs md:text-sm">
                      <DollarSign className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Variantes</span>
                      <span className="sm:hidden">Var</span>
                    </TabsTrigger>
                    <TabsTrigger value="extras" className="text-xs md:text-sm">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Extras
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="text-xs md:text-sm">
                      <Package className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Insumos</span>
                      <span className="sm:hidden">Inv</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* BASIC TAB */}
                  <TabsContent value="basic" className="space-y-6 mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Información Básica</CardTitle>
                        <CardDescription>Datos principales del producto</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                              Nombre del Producto <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Ej: Café Americano"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            {isCreatingCategory ? (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Nueva categoría"
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateCategory}
                                  disabled={!newCategoryName.trim()}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setIsCreatingCategory(false);
                                    setNewCategoryName("");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsCreatingCategory(true)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Descripción</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción del producto (opcional)"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="base_price" className="flex items-center gap-2">
                              Precio Base <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="base_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={basePrice}
                                onChange={(e) => setBasePrice(Number(e.target.value))}
                                className="pl-10"
                                placeholder="0.00"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Estado del Producto</Label>
                            <div className="flex items-center space-x-3 h-10 px-3 rounded-md border">
                              <Switch checked={isActive} onCheckedChange={setIsActive} />
                              <Label className="cursor-pointer">
                                {isActive ? (
                                  <Badge className="bg-green-500">Activo</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactivo</Badge>
                                )}
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Imagen del Producto</CardTitle>
                        <CardDescription>Agrega una foto que represente tu producto</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {previewUrl && (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-dashed">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <Input
                            ref={imageInputRef}
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Label htmlFor="image-upload">
                            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary hover:bg-accent/50 transition-all">
                              <Upload className="h-5 w-5" />
                              <span className="text-sm font-medium">
                                {previewUrl ? "Cambiar imagen" : "Seleccionar imagen"}
                              </span>
                            </div>
                          </Label>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                          Recomendado: JPG, PNG (máx. 5MB)
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Configuración Adicional</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label className="text-base">Tiene variantes (tamaños)</Label>
                            <p className="text-sm text-muted-foreground">Ej: Chico, Mediano, Grande</p>
                          </div>
                          <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <Label className="text-base">Tiene extras/modificadores</Label>
                            <p className="text-sm text-muted-foreground">Ej: Extra queso, Doble carne</p>
                          </div>
                          <Switch checked={hasExtras} onCheckedChange={setHasExtras} />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="space-y-0.5">
                              <Label className="text-base">Genera puntos de lealtad</Label>
                              <p className="text-sm text-muted-foreground">
                                Recompensa a tus clientes frecuentes
                              </p>
                            </div>
                            <Switch checked={generatesPoints} onCheckedChange={setGeneratesPoints} />
                          </div>

                          {generatesPoints && (
                            <div className="ml-4 space-y-2 animate-in fade-in-50 duration-300">
                              <Label htmlFor="points_value">Puntos por venta</Label>
                              <Input
                                id="points_value"
                                type="number"
                                min="0"
                                value={pointsValue}
                                onChange={(e) => setPointsValue(Number(e.target.value))}
                                placeholder="0"
                              />
                              <p className="text-xs text-muted-foreground">
                                Cantidad de puntos que gana el cliente al comprar este producto
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Tabs>
                </div>

                <div className="px-6 py-4 border-t bg-muted/50 flex justify-end gap-3 shrink-0">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {product ? "Actualizar Producto" : "Crear Producto"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="products"
        currentPlan={currentPlan}
        currentLimit={productCount}
        suggestedPlan={currentPlan === "basic" ? "professional" : "premium"}
      />
    </>
  );
}