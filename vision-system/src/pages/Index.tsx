import { useState } from "react";  //index.tsx
import { ShoppingCart, Receipt, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ItemCard from "@/components/ItemCard";
import ReceiptModal from "@/components/ReceiptModal";
import { CartItem } from "@/types/cart";
import { toast } from "sonner";

// Mock data for demonstration
const mockItems: CartItem[] = [
  {
    id: "1",
    name: "Chips",
    quantity: 2,
    unitPrice: 5.00,
    totalPrice: 10.00,
    scannedAt: new Date(),
  },
  {
    id: "2",
    name: "Chocolate",
    quantity: 3,
    unitPrice: 8.00,
    totalPrice: 24.00,
    scannedAt: new Date(),
  },
  {
    id: "3",
    name: "Glue Gun",
    quantity: 1,
    unitPrice: 45.00,
    totalPrice: 45.00,
    scannedAt: new Date(),
  },
  {
    id: "4",
    name: "Maggi",
    quantity: 4,
    unitPrice: 3.50,
    totalPrice: 14.00,
    scannedAt: new Date(),
  },
  {
    id: "5",
    name: "Five Star",
    quantity: 2,
    unitPrice: 6.00,
    totalPrice: 12.00,
    scannedAt: new Date(),
  },
];

const Index = () => {
  const [items, setItems] = useState<CartItem[]>(mockItems);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<CartItem[] | null>(null);

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Cart is empty", {
        description: "Please scan items before checkout",
      });
      return;
    }

    setReceiptData(items);
    setShowReceipt(true);
    toast.success("Payment processed successfully!", {
      description: "Your digital receipt is ready",
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (item.id === itemId) {
          const newQuantity = item.quantity - 1;
          if (newQuantity <= 0) {
            toast.info("Item removed", {
              description: `${item.name} removed from cart`,
            });
            return null;
          }
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
      
      return updatedItems;
    });
  };

  const handleReset = () => {
    setItems([]);
    setReceiptData(null);
    toast.info("Cart reset", {
      description: "Ready for next customer",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary p-2">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">GrabCart</h1>
                <p className="text-sm text-muted-foreground">by Aarav Rasquinha and Jai Pareek</p>
              </div>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Cart
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items List */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Scanned Items
                </h2>
                <div className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </div>
              </div>
              <Separator className="mb-4" />
              <ScrollArea className="h-[500px] pr-4">
                {items.length === 0 ? (
                  <div className="flex h-[400px] flex-col items-center justify-center text-center">
                    <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                    <h3 className="mb-2 text-lg font-medium text-foreground">
                      Cart is empty
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Scan items to add them to your cart
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} onRemove={handleRemoveItem} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Checkout Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Order Summary
                </h2>
              </div>
              <Separator className="mb-4" />
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    AED {totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (0%)</span>
                  <span className="font-medium text-foreground">AED 0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">AED {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Receipt className="h-5 w-5" />
                Proceed to Payment
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Scan items will be automatically added to your cart
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          open={showReceipt}
          onOpenChange={setShowReceipt}
          items={receiptData}
          totalAmount={totalAmount}
        />
      )}
    </div>
  );
};

export default Index;