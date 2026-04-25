import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, Upload, Plus, Trash2, Image as ImageIcon, Info, DollarSign, Package, CheckCircle2, Tag, Save } from "lucide-react";
import { productService } from "@/services/productService";
import { businessService } from "@/services/businessService";
import { categoryService } from "@/services/categoryService";
import * as inventoryService from "@/services/inventoryService";
import type { Database } from "@/integrations/supabase/types";
import { storageService } from "@/services/storageService";
import { FeatureGuard } from "./FeatureGuard";
import { UpgradePlanModal } from "./UpgradePlanModal";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

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
  
  const [businessId, setBusinessId] = useState<string>("");
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
      setBusinessId(product.business_id || "");
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
      
      setBusinessId(business.id);

      const [categoriesData, inventoryData] = await Promise.all([
        categoryService.getCategories(business.id),
        inventoryService.getInventoryItems(business.id)
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

      const extrasWithInventory = await Promise.all(
        extrasData.map(async (e) => {
          const { data: extraLinks } = await supabase
            .from("product_inventory_items")
            .select("*")
            .eq("product_id", product.id)
            .eq("extra_id", e.id);

          return {
            id: e.id,
            name: e.name,
            price: Number(e.price),
            sort_order: e.sort_order || 0,
            ingredients: (extraLinks || []).map((link) => ({
              inventory_id: link.inventory_item_id,
              quantity: Number(link.quantity_per_unit),
            })),
          };
        })
      );

      setVariants(variantsWithInventory);
      setExtras(extrasWithInventory);
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
    if (!businessId) return;

    setLoading(true);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        finalImageUrl = await uploadImageToStorage(businessId);
      }

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
        const result = await productService.createProduct(businessId, productData);
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
          let extraId = extra.id;

          if (extra.id && existingIds.includes(extra.id)) {
            await productService.updateProductExtra(extra.id, {
              name: extra.name,
              price: extra.price,
              sort_order: extra.sort_order,
            });
          } else {
            const { extra: newExtra } = await productService.createExtra(savedProduct.id, {
              name: extra.name,
              price: extra.price,
              sort_order: extra.sort_order,
            });
            extraId = newExtra?.id;
          }

          // Save extra inventory links
          if (extraId) {
            const { data: existingLinks } = await supabase
              .from("product_inventory_items")
              .select("*")
              .eq("product_id", savedProduct.id)
              .eq("extra_id", extraId);

            const linksToSave = extra.ingredients && extra.ingredients.length > 0
              ? extra.ingredients.map((ing) => ({
                  inventory_item_id: ing.inventory_id,
                  quantity_per_unit: ing.quantity,
                  id: undefined,
                }))
              : [];

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
                  extra_id: extraId,
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
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden">
          {/* Header Fixed */}
          <DialogHeader className="px-6 py-4 border-b shrink-0">
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

          {/* Body/Form Flex Container */}
          <div className="flex-1 overflow-hidden">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              
              {/* Tabs Section */}
              <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden w-full">
                
                {/* TabsList Fixed */}
                <div className="px-6 pt-4 shrink-0">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
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
                </div>

                {/* TabsContent Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  
                  {/* BASIC TAB */}
                  <TabsContent value="basic" className="mt-0 space-y-6">
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
                              <Label className="cursor-pointer flex-1">
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
                          <div className="relative w-full sm:w-1/2 mx-auto aspect-video rounded-lg overflow-hidden border-2 border-dashed">
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
                  </TabsContent>

                  {/* VARIANTS TAB */}
                  <TabsContent value="variants" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Variantes del Producto</h3>
                        <p className="text-sm text-muted-foreground">Tamaños, presentaciones o colores</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setVariants([...variants, { name: "", price_modifier: 0, sort_order: variants.length, inventory_links: [] }])}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Variante
                      </Button>
                    </div>

                    {variants.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                          <Tag className="h-10 w-10 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium mb-2">No hay variantes</h4>
                          <p className="text-sm text-muted-foreground max-w-sm mb-4">
                            Agrega diferentes tamaños o presentaciones para este producto.
                          </p>
                          <Button type="button" variant="secondary" onClick={() => setVariants([...variants, { name: "", price_modifier: 0, sort_order: 0, inventory_links: [] }])}>
                            Crear primera variante
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <Card key={index} className="relative overflow-hidden border-primary/20">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <CardHeader className="py-4 flex flex-row items-start justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Badge variant="outline">Variante {index + 1}</Badge>
                                </CardTitle>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setVariants(variants.filter((_, i) => i !== index))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nombre de la Variante</Label>
                                  <Input
                                    value={variant.name}
                                    onChange={(e) => {
                                      const newVariants = [...variants];
                                      newVariants[index].name = e.target.value;
                                      setVariants(newVariants);
                                    }}
                                    placeholder="Ej: Grande"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Precio Adicional</Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={variant.price !== undefined ? variant.price : variant.price_modifier}
                                      onChange={(e) => {
                                        const newVariants = [...variants];
                                        newVariants[index].price = Number(e.target.value);
                                        newVariants[index].price_modifier = Number(e.target.value);
                                        setVariants(newVariants);
                                      }}
                                      className="pl-10"
                                      placeholder="0.00"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Insumos de la variante */}
                              <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-semibold">Insumos de esta variante</Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newVariants = [...variants];
                                      if (!newVariants[index].ingredients) {
                                        newVariants[index].ingredients = [];
                                      }
                                      newVariants[index].ingredients!.push({
                                        inventory_id: "",
                                        quantity: 1,
                                      });
                                      setVariants(newVariants);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar Insumo
                                  </Button>
                                </div>

                                {variant.ingredients && variant.ingredients.length > 0 ? (
                                  <div className="space-y-2">
                                    {variant.ingredients.map((ingredient, ingIndex) => (
                                      <div key={ingIndex} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-1">
                                          <Label className="text-xs">Insumo</Label>
                                          <Select
                                            value={ingredient.inventory_id}
                                            onValueChange={(val) => {
                                              const newVariants = [...variants];
                                              newVariants[index].ingredients![ingIndex].inventory_id = val;
                                              const item = inventoryItems.find((i) => i.id === val);
                                              if (item) {
                                                newVariants[index].ingredients![ingIndex].inventory_name = item.name;
                                              }
                                              setVariants(newVariants);
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {inventoryItems.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                  {item.name} ({item.current_stock} {item.unit})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="w-28 space-y-1">
                                          <Label className="text-xs">Cantidad</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={ingredient.quantity}
                                            onChange={(e) => {
                                              const newVariants = [...variants];
                                              newVariants[index].ingredients![ingIndex].quantity = Number(e.target.value);
                                              setVariants(newVariants);
                                            }}
                                            placeholder="1"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          className="text-destructive"
                                          onClick={() => {
                                            const newVariants = [...variants];
                                            newVariants[index].ingredients!.splice(ingIndex, 1);
                                            setVariants(newVariants);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    Sin insumos asignados a esta variante
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* EXTRAS TAB */}
                  <TabsContent value="extras" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Extras o Modificadores</h3>
                        <p className="text-sm text-muted-foreground">Opciones adicionales con costo extra</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setExtras([...extras, { name: "", price: 0, sort_order: extras.length }])}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Agregar Extra
                      </Button>
                    </div>

                    {extras.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                          <Plus className="h-10 w-10 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium mb-2">No hay extras</h4>
                          <p className="text-sm text-muted-foreground max-w-sm mb-4">
                            Agrega complementos opcionales para este producto.
                          </p>
                          <Button type="button" variant="secondary" onClick={() => setExtras([...extras, { name: "", price: 0, sort_order: 0 }])}>
                            Crear primer extra
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {extras.map((extra, index) => (
                          <Card key={index} className="relative overflow-hidden border-accent/20">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                            <CardHeader className="py-4 flex flex-row items-start justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Badge variant="outline" className="text-accent border-accent">Extra {index + 1}</Badge>
                                </CardTitle>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setExtras(extras.filter((_, i) => i !== index))}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nombre del Extra</Label>
                                  <Input
                                    value={extra.name}
                                    onChange={(e) => {
                                      const newExtras = [...extras];
                                      newExtras[index].name = e.target.value;
                                      setExtras(newExtras);
                                    }}
                                    placeholder="Ej: Extra Queso"
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Precio del Extra</Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={extra.price}
                                      onChange={(e) => {
                                        const newExtras = [...extras];
                                        newExtras[index].price = Number(e.target.value);
                                        setExtras(newExtras);
                                      }}
                                      className="pl-10"
                                      placeholder="0.00"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Insumos del extra */}
                              <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-semibold">Insumos de este extra</Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newExtras = [...extras];
                                      if (!newExtras[index].ingredients) {
                                        newExtras[index].ingredients = [];
                                      }
                                      newExtras[index].ingredients!.push({
                                        inventory_id: "",
                                        quantity: 1,
                                      });
                                      setExtras(newExtras);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Agregar Insumo
                                  </Button>
                                </div>

                                {extra.ingredients && extra.ingredients.length > 0 ? (
                                  <div className="space-y-2">
                                    {extra.ingredients.map((ingredient, ingIndex) => (
                                      <div key={ingIndex} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-1">
                                          <Label className="text-xs">Insumo</Label>
                                          <Select
                                            value={ingredient.inventory_id}
                                            onValueChange={(val) => {
                                              const newExtras = [...extras];
                                              newExtras[index].ingredients![ingIndex].inventory_id = val;
                                              const item = inventoryItems.find((i) => i.id === val);
                                              if (item) {
                                                newExtras[index].ingredients![ingIndex].inventory_name = item.name;
                                              }
                                              setExtras(newExtras);
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {inventoryItems.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                  {item.name} ({item.current_stock} {item.unit})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="w-28 space-y-1">
                                          <Label className="text-xs">Cantidad</Label>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={ingredient.quantity}
                                            onChange={(e) => {
                                              const newExtras = [...extras];
                                              newExtras[index].ingredients![ingIndex].quantity = Number(e.target.value);
                                              setExtras(newExtras);
                                            }}
                                            placeholder="1"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          className="text-destructive"
                                          onClick={() => {
                                            const newExtras = [...extras];
                                            newExtras[index].ingredients!.splice(ingIndex, 1);
                                            setExtras(newExtras);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    Sin insumos asignados a este extra
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* INVENTORY TAB */}
                  <TabsContent value="inventory" className="mt-0 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Insumos Base</h3>
                        <p className="text-sm text-muted-foreground">Ingredientes a descontar de inventario</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setProductInventoryLinks([...productInventoryLinks, { inventory_item_id: "", quantity_per_unit: 1 }])}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Vincular Insumo
                      </Button>
                    </div>

                    {productInventoryLinks.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                          <Package className="h-10 w-10 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-medium mb-2">Sin insumos vinculados</h4>
                          <p className="text-sm text-muted-foreground max-w-sm mb-4">
                            Al enlazar este producto con tu inventario, las existencias se descontarán automáticamente en cada venta.
                          </p>
                          <Button type="button" variant="secondary" onClick={() => setProductInventoryLinks([...productInventoryLinks, { inventory_item_id: "", quantity_per_unit: 1 }])}>
                            Vincular primer insumo
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {productInventoryLinks.map((link, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-lg border bg-card">
                            <div className="flex-1 space-y-2">
                              <Label>Insumo del Inventario</Label>
                              <Select value={link.inventory_item_id} onValueChange={(val) => {
                                const newLinks = [...productInventoryLinks];
                                newLinks[index].inventory_item_id = val;
                                setProductInventoryLinks(newLinks);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un insumo..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {inventoryItems.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name} ({item.current_stock} {item.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-full sm:w-40 space-y-2">
                              <Label>Cantidad a restar</Label>
                              <Input type="number" step="0.01" min="0" value={link.quantity_per_unit} onChange={(e) => {
                                const newLinks = [...productInventoryLinks];
                                newLinks[index].quantity_per_unit = Number(e.target.value);
                                setProductInventoryLinks(newLinks);
                              }} placeholder="Ej: 1" />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive mt-2 sm:mt-0 sm:mb-0.5" onClick={() => {
                              setProductInventoryLinks(productInventoryLinks.filter((_, i) => i !== index));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                </div>
              </Tabs>

              {/* Footer Fixed */}
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
                      <Save className="mr-2 h-4 w-4" />
                      {product ? "Actualizar Producto" : "Crear Producto"}
                    </>
                  )}
                </Button>
              </div>
            </form>
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