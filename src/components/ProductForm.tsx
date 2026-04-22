import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Package, Upload, Sparkles, X, DollarSign, Tag, AlertCircle } from "lucide-react";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { inventoryService } from "@/services/inventoryService";
import { subscriptionService } from "@/services/subscriptionService";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";
import type { Product, ProductVariant, ProductExtra } from "@/services/productService";
import type { Category } from "@/services/categoryService";
import type { InventoryItem } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  businessId: string;
  onClose: () => void;
  onCategoryCreated?: () => void;
  onSuccess?: () => void;
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

export function ProductForm({
  product,
  categories,
  businessId,
  onClose,
  onCategoryCreated,
  onSuccess,
}: ProductFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [basePrice, setBasePrice] = useState(
    product?.base_price ? Number(product.base_price) : 0
  );
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [hasVariants, setHasVariants] = useState(product?.has_variants || false);
  const [hasExtras, setHasExtras] = useState(product?.has_extras || false);
  const [generatesPoints, setGeneratesPoints] = useState(product?.generates_points || false);
  const [pointsValue, setPointsValue] = useState(product?.points_value || 0);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(product?.image_url || "");

  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [extras, setExtras] = useState<ExtraForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [productInventoryLinks, setProductInventoryLinks] = useState<
    ProductInventoryLink[]
  >([]);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loadingImage, setLoadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"basic" | "professional" | "premium">("basic");
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setCategoryId(product.category_id || "");
      // basePrice state requires a number
      setBasePrice(product.base_price || 0);
      setImageUrl(product.image_url || "");
      setIsActive(product.is_active ?? true);
      // variants and extras aren't on the product object directly, they are loaded separately
      // setVariants(product.variants || []);
      // setExtras(product.extras || []);
    }
    loadInventoryItems();
  }, [product]);

  async function loadInventoryItems() {
    try {
      setLoadingInventory(true);
      const business = await businessService.getCurrentBusiness();
      if (business) {
        const items = await getInventoryItems(business.id);
        setInventoryItems(items || []);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoadingInventory(false);
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

      // Cargar variantes con sus insumos
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

  async function loadProductInventoryLinks(
    productId: string
  ): Promise<ProductInventoryLink[]> {
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { category, error } = await categoryService.createCategory(
        businessId,
        { name: newCategoryName }
      );

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

      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { 
        name: "", 
        price_modifier: 0, 
        price: 0,
        sort_order: variants.length,
        inventory_links: [],
        ingredients: []
      },
    ]);
  };

  const updateVariantField = (
    index: number,
    field: keyof VariantForm,
    value: string | number
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addVariantInventoryLink = (variantIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].inventory_links.push({
      inventory_item_id: "",
      quantity_per_unit: 1,
    });
    setVariants(updated);
  };

  const updateVariantInventoryLink = (
    variantIndex: number,
    linkIndex: number,
    field: "inventory_item_id" | "quantity_per_unit",
    value: string | number
  ) => {
    const updated = [...variants];
    updated[variantIndex].inventory_links[linkIndex] = {
      ...updated[variantIndex].inventory_links[linkIndex],
      [field]: value,
    };
    setVariants(updated);
  };

  const removeVariantInventoryLink = (variantIndex: number, linkIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].inventory_links = updated[variantIndex].inventory_links.filter(
      (_, i) => i !== linkIndex
    );
    setVariants(updated);
  };

  const addExtra = () => {
    setExtras([...extras, { name: "", price: 0, sort_order: extras.length, ingredients: [] }]);
  };

  const updateExtraField = (
    index: number,
    field: keyof ExtraForm,
    value: string | number
  ) => {
    const updated = [...extras];
    updated[index] = { ...updated[index], [field]: value };
    setExtras(updated);
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  const addInventoryLink = () => {
    setProductInventoryLinks([
      ...productInventoryLinks,
      { inventory_item_id: "", quantity_per_unit: 1 },
    ]);
  };

  const updateInventoryLinkField = (
    index: number,
    field: keyof ProductInventoryLink,
    value: string | number
  ) => {
    const updated = [...productInventoryLinks];
    updated[index] = { ...updated[index], [field]: value };
    setProductInventoryLinks(updated);
  };

  const removeInventoryLink = (index: number) => {
    setProductInventoryLinks(productInventoryLinks.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAIImage = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Primero ingresa el nombre del producto",
        variant: "destructive",
      });
      return;
    }

    // Feature coming soon message
    toast({
      title: "Función en desarrollo",
      description: "La generación de imágenes con IA estará disponible próximamente. Por ahora, usa la opción de subir imagen.",
    });
    
    /* 
    // Code for when AI generation is ready
    setGeneratingImage(true);
    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) throw new Error("No business found");

      const { url, path } = await storageService.generateAIImage(name, business.id);
      setImageUrl(url);
      setPreviewUrl(url);
      
      toast({
        title: "Imagen generada",
        description: "La imagen se generó correctamente con IA",
      });
    } catch (error) {
      console.error("Error generating AI image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen con IA",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
    */
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setPreviewUrl("");
    setImageFile(null);
  };

  const uploadImageToStorage = async (businessId: string): Promise<string> => {
    if (!imageFile) return imageUrl;

    try {
      const { url } = await storageService.uploadProductImage(imageFile, businessId);
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If creating new product, check limit
    if (!product) {
      const canAdd = await subscriptionService.canAddProduct();
      if (!canAdd.canAdd) {
        const plan = await subscriptionService.getCurrentPlan();
        setCurrentPlan(plan as "basic" | "professional" | "premium");
        
        // Get current product count
        const business = await subscriptionService["getCurrentBusiness"]?.() || { id: "" };
        const { count } = await productService["supabase"]
          ?.from("products")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id) || { count: 0 };
        
        setProductCount(count || 0);
        setShowUpgradeModal(true);
        return;
      }
    }

    setLoading(true);

    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) throw new Error("No business found");

      // Upload image if there's a file selected
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
        const existingVariants = await productService.getProductVariants(
          savedProduct.id
        );
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

          // Guardar insumos de la variante
          if (variantId) {
            const { data: existingLinks } = await supabase
              .from("product_inventory_items")
              .select("*")
              .eq("product_id", savedProduct.id)
              .eq("variant_id", variantId);

            const existingLinkIds = (existingLinks || []).map((l) => l.id);
            
            // Usar ingredients si existe, de lo contrario usar inventory_links
            const linksToSave = variant.ingredients && variant.ingredients.length > 0 
              ? variant.ingredients.map(ing => ({
                  inventory_item_id: ing.inventory_id,
                  quantity_per_unit: ing.quantity,
                  id: undefined // no sabemos el id de esta estructura
                }))
              : variant.inventory_links || [];

            for (const link of linksToSave) {
              if (!link.inventory_item_id) continue;
              
              // Buscar si ya existe este link por inventory_item_id en lugar de por link.id
              // ya que la estructura de ingredients no tiene link.id
              const existingLink = existingLinks?.find(l => l.inventory_item_id === link.inventory_item_id);

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

            // Eliminar links que ya no están en ingredients/inventory_links
            const linkItemIds = linksToSave.map(l => l.inventory_item_id).filter(Boolean);
            const toDeleteLinks = existingLinks?.filter(
              (l) => !linkItemIds.includes(l.inventory_item_id)
            ) || [];
            
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

      // Save inventory links (solo para producto base, sin variante)
      const existingLinks = await loadProductInventoryLinks(savedProduct.id);
      const existingLinkIds = existingLinks.map((l) => l.id).filter(Boolean);

      for (const link of productInventoryLinks) {
        if (!link.inventory_item_id) continue;

        if (link.id && existingLinkIds.includes(link.id)) {
          await supabase
            .from("product_inventory_items")
            .update({
              quantity_per_unit: link.quantity_per_unit,
            })
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

      const linkInventoryIds = productInventoryLinks
        .filter((l) => l.id)
        .map((l) => l.id);
      const toDeleteLinks = existingLinkIds.filter(
        (id) => !linkInventoryIds.includes(id)
      );
      for (const id of toDeleteLinks) {
        await supabase.from("product_inventory_items").delete().eq("id", id);
      }

      toast({
        title: "Producto guardado",
        description: "El producto se guardó correctamente con todos sus detalles",
      });
      onClose();
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
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {product ? "Editar Producto" : "Nuevo Producto"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="variants">Variantes</TabsTrigger>
                <TabsTrigger value="extras">Extras</TabsTrigger>
                <TabsTrigger value="inventory">Insumos Base</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Producto *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Ej: Café Americano"
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
                          Crear
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
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger className="flex-1">
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
                          <Plus className="w-4 h-4 mr-1" />
                          Nueva
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
                    placeholder="Descripción del producto"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Precio Base *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Imagen del Producto</Label>
                    
                    {/* Image Preview */}
                    {previewUrl && (
                      <div className="relative w-full h-48 rounded-lg border overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Upload and AI Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage || generatingImage}
                        />
                        <Label htmlFor="image-upload">
                          <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary hover:bg-accent transition-colors">
                            <Upload className="h-5 w-5" />
                            <span className="text-sm font-medium">
                              {uploadingImage ? "Subiendo..." : "Subir Imagen"}
                            </span>
                          </div>
                        </Label>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateAIImage}
                        disabled={!name.trim()}
                        className="h-auto p-4"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generar con IA
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Sube una imagen desde tu dispositivo. La generación automática con IA estará disponible próximamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Producto activo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
                  <Label>Tiene variantes (tamaños)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={hasExtras} onCheckedChange={setHasExtras} />
                  <Label>Tiene extras/modificadores</Label>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-3 text-sm">Programa de Lealtad</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={generatesPoints}
                        onCheckedChange={setGeneratesPoints}
                      />
                      <Label>Genera puntos de lealtad</Label>
                    </div>

                    {generatesPoints && (
                      <div className="ml-8 space-y-2">
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
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Variantes de Producto</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Cada variante puede tener sus propios insumos. Ej: Café Chico usa vaso chico, Café Grande usa vaso grande.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Variants Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Variantes (Tamaños)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVariants([...variants, { name: "", price: 0, price_modifier: 0, sort_order: variants.length, inventory_links: [], ingredients: [] }])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Variante
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Nombre de Variante</Label>
                                    <Input
                                      value={variant.name}
                                      onChange={(e) => {
                                        const newVariants = [...variants];
                                        newVariants[index].name = e.target.value;
                                        setVariants(newVariants);
                                      }}
                                      placeholder="Ej: Pequeño, Mediano, Grande"
                                    />
                                  </div>
                                  <div>
                                    <Label>Precio Extra</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={variant.price}
                                      onChange={(e) => {
                                        const newVariants = [...variants];
                                        newVariants[index].price = parseFloat(e.target.value) || 0;
                                        setVariants(newVariants);
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              {/* Ingredients for this variant */}
                              <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Insumos para esta variante</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
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
                                      <div key={ingIndex} className="flex items-center gap-2">
                                        <select
                                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                          value={ingredient.inventory_id}
                                          onChange={(e) => {
                                            const newVariants = [...variants];
                                            newVariants[index].ingredients![ingIndex].inventory_id = e.target.value;
                                            const selectedItem = availableInventory.find(item => item.id === e.target.value);
                                            if (selectedItem) {
                                              newVariants[index].ingredients![ingIndex].inventory_name = selectedItem.name;
                                            }
                                            setVariants(newVariants);
                                          }}
                                        >
                                          <option value="">Seleccionar insumo...</option>
                                          {availableInventory.map((item) => (
                                            <option key={item.id} value={item.id}>
                                              {item.name} ({item.quantity} {item.unit})
                                            </option>
                                          ))}
                                        </select>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          className="w-24"
                                          value={ingredient.quantity}
                                          onChange={(e) => {
                                            const newVariants = [...variants];
                                            newVariants[index].ingredients![ingIndex].quantity = parseFloat(e.target.value) || 0;
                                            setVariants(newVariants);
                                          }}
                                          placeholder="Cant."
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            const newVariants = [...variants];
                                            newVariants[index].ingredients = newVariants[index].ingredients!.filter((_, i) => i !== ingIndex);
                                            setVariants(newVariants);
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No hay insumos asignados a esta variante
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {variants.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay variantes. Agrega una para ofrecer diferentes tamaños.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="extras" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extras/Modificadores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Extras Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Extras (Modificadores)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setExtras([...extras, { name: "", price: 0, sort_order: extras.length, ingredients: [] }])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Extra
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {extras.map((extra, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6 space-y-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Nombre de Extra</Label>
                                    <Input
                                      value={extra.name}
                                      onChange={(e) => {
                                        const newExtras = [...extras];
                                        newExtras[index].name = e.target.value;
                                        setExtras(newExtras);
                                      }}
                                      placeholder="Ej: Extra queso, Doble carne"
                                    />
                                  </div>
                                  <div>
                                    <Label>Precio Extra</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={extra.price}
                                      onChange={(e) => {
                                        const newExtras = [...extras];
                                        newExtras[index].price = parseFloat(e.target.value) || 0;
                                        setExtras(newExtras);
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setExtras(extras.filter((_, i) => i !== index))}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>

                              {/* Ingredients for this extra */}
                              <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Insumos para este extra</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
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
                                      <div key={ingIndex} className="flex items-center gap-2">
                                        <select
                                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                          value={ingredient.inventory_id}
                                          onChange={(e) => {
                                            const newExtras = [...extras];
                                            newExtras[index].ingredients![ingIndex].inventory_id = e.target.value;
                                            const selectedItem = availableInventory.find(item => item.id === e.target.value);
                                            if (selectedItem) {
                                              newExtras[index].ingredients![ingIndex].inventory_name = selectedItem.name;
                                            }
                                            setExtras(newExtras);
                                          }}
                                        >
                                          <option value="">Seleccionar insumo...</option>
                                          {availableInventory.map((item) => (
                                            <option key={item.id} value={item.id}>
                                              {item.name} ({item.quantity} {item.unit})
                                            </option>
                                          ))}
                                        </select>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          className="w-24"
                                          value={ingredient.quantity}
                                          onChange={(e) => {
                                            const newExtras = [...extras];
                                            newExtras[index].ingredients![ingIndex].quantity = parseFloat(e.target.value) || 0;
                                            setExtras(newExtras);
                                          }}
                                          placeholder="Cant."
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            const newExtras = [...extras];
                                            newExtras[index].ingredients = newExtras[index].ingredients!.filter((_, i) => i !== ingIndex);
                                            setExtras(newExtras);
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No hay insumos asignados a este extra
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {extras.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay extras. Agrega uno para ofrecer modificadores.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Insumos del Producto Base
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Insumos que se consumen independientemente de la variante. Ej: café en grano, azúcar, etc.
                      Para insumos específicos por variante (vasos, tapas), usa la pestaña Variantes.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {productInventoryLinks.map((link, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Label>Insumo</Label>
                          <Select
                            value={link.inventory_item_id}
                            onValueChange={(value) =>
                              updateInventoryLinkField(index, "inventory_item_id", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar insumo" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-[150px]">
                          <Label>Cantidad por unidad</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={link.quantity_per_unit}
                            onChange={(e) =>
                              updateInventoryLinkField(
                                index,
                                "quantity_per_unit",
                                Number(e.target.value)
                              )
                            }
                            placeholder="1.00"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInventoryLink(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addInventoryLink}
                      disabled={inventoryItems.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Insumo
                    </Button>
                    {inventoryItems.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No hay insumos disponibles. Crea insumos en el módulo de Inventario primero.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Producto"}
              </Button>
            </div>
          </form>
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