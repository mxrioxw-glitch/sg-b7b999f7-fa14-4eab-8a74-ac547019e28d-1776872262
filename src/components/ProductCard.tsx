import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  inStock?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  category,
  image,
  inStock = true,
  onClick,
  className,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      onClick={inStock ? onClick : undefined}
      className={cn(
        "group relative cursor-pointer overflow-hidden transition-all hover:shadow-lg",
        !inStock && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {image && !imageError ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-4xl">☕</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-foreground">{name}</h3>
          {inStock && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent transition-colors group-hover:bg-accent/80">
              <Plus className="h-4 w-4 text-accent-foreground" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <p className="text-lg font-bold text-primary">
            ${price.toFixed(2)}
          </p>
        </div>

        {!inStock && (
          <Badge variant="destructive" className="mt-2 w-full justify-center">
            Sin stock
          </Badge>
        )}
      </div>
    </Card>
  );
}