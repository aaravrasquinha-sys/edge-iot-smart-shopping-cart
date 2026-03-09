import { Package, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types/cart";

interface ItemCardProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
}

const ItemCard = ({ item, onRemove }: ItemCardProps) => {
  return (
    <Card className="p-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        {/* Item Image/Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-secondary-foreground" />
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1">
          <h3 className="font-semibold text-card-foreground">{item.name}</h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Qty: {item.quantity}</span>
            <span>•</span>
            <span>AED {item.unitPrice.toFixed(2)} each</span>
          </div>
        </div>

        {/* Item Total */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              AED {item.totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ItemCard;
