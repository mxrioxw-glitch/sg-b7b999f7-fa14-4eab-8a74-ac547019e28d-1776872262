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
import { Plus, Trash2 } from "lucide-react";
import { productService } from "@/services/productService";
import { businessService } from "@/services/businessService";
import type { Product, ProductVariant, ProductExtra } from "@/services/productService";
import type { Category } from "@/services/categoryService";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
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

export function ProductForm({ product, categories, onClose }: ProductFormProps) {
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

  useEffect(() => {
    if (product) {
      loadProductDetails();
    }
  }, [product]);

  async function loadProductDetails() {
    if (!product) return;

    try {
      const [variantsData, extrasData] = await Promise.all([
        productService.getProductVariants(product.id),
        productService.getProductExtras(product.id),
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
    } catch (error) {
      console.error("Error loading product details:", error);
    }
  }

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
        const existingVariants = await productService.getProductVariants(savedProduct.id);
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

      toast({
        title: "Producto guardado",
        description: "El producto se guardó correctamente",
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Información Básica</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
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
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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