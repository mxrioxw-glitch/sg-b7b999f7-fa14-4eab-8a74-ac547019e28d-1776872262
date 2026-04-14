import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Package } from "lucide-react";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { getInventoryItems } from "@/services/inventoryService";
import { businessService } from "@/services/businessService";
import { supabase } from "@/integrations/supabase/client";
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
}

interface VariantForm {
  id?: string;
  name: string;
  price_modifier: number;
  sort_order: number;
}

interface ExtraForm {
  id?: string;
  name: string;
  price: number;
  sort_order: number;
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

  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [extras, setExtras] = useState<ExtraForm[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [productInventoryLinks, setProductInventoryLinks] = useState<
    ProductInventoryLink[]
  >([]);

  // Category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    loadInventoryItems();
    if (product) {
      loadProductDetails();
    }
  }, [product]);

  async function loadInventoryItems() {
    try {
      const items = await getInventoryItems(businessId);
      setInventoryItems(items);
    } catch (error) {
      console.error("Error loading inventory items:", error);
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

      setVariants(
        variantsData.map((v) => ({
          id: v.id,
          name: v.name,
          price_modifier: Number(v.price_modifier),
          sort_order: v.sort_order || 0,
        }))
      );

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
      .eq("product_id", productId);

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
      { name: "", price_modifier: 0, sort_order: variants.length },
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

  const addExtra = () => {
    setExtras([...extras, { name: "", price: 0, sort_order: extras.length }]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const business = await businessService.getCurrentBusiness();
      if (!business) throw new Error("No business found");

      const productData = {
        category_id: categoryId || undefined,
        name,
        description,
        base_price: basePrice,
        image_url: imageUrl || undefined,
        has_variants: hasVariants,
        has_extras: hasExtras,
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
          if (variant.id && existingIds.includes(variant.id)) {
            await productService.updateProductVariant(variant.id, {
              name: variant.name,
              price_modifier: variant.price_modifier,
              sort_order: variant.sort_order,
            });
          } else {
            await productService.createVariant(savedProduct.id, {
              name: variant.name,
              price_modifier: variant.price_modifier,
              sort_order: variant.sort_order,
            });
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
            .update({
              quantity_per_unit: link.quantity_per_unit,
            })
            .eq("id", link.id);
        } else {
          await supabase.from("product_inventory_items").insert({
            product_id: savedProduct.id,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
          <TabsTrigger value="inventory">Insumos</TabsTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="image_url">URL de Imagen</Label>
              <Input
                id="image_url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
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
        </TabsContent>

        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variantes de Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {variants.map((variant, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Nombre (Ej: Chico, Mediano, Grande)</Label>
                    <Input
                      value={variant.name}
                      onChange={(e) =>
                        updateVariantField(index, "name", e.target.value)
                      }
                      placeholder="Nombre de variante"
                    />
                  </div>
                  <div className="w-[150px]">
                    <Label>Modificador de precio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.price_modifier}
                      onChange={(e) =>
                        updateVariantField(
                          index,
                          "price_modifier",
                          Number(e.target.value)
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Variante
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Extras/Modificadores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {extras.map((extra, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Nombre (Ej: Leche de almendra, Shot extra)</Label>
                    <Input
                      value={extra.name}
                      onChange={(e) =>
                        updateExtraField(index, "name", e.target.value)
                      }
                      placeholder="Nombre del extra"
                    />
                  </div>
                  <div className="w-[150px]">
                    <Label>Precio adicional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={extra.price}
                      onChange={(e) =>
                        updateExtraField(index, "price", Number(e.target.value))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExtra(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addExtra}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Extra
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Insumos del Producto
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Define qué insumos se consumen al vender este producto. Se
                descontarán automáticamente del inventario.
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
                  No hay insumos disponibles. Crea insumos en el módulo de
                  Inventario primero.
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
  );
}