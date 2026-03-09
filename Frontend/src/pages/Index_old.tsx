import { useState, useEffect } from "react";
import { ShoppingCart, Receipt, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ItemCard from "@/components/ItemCard";
import { CartItem } from "@/types/cart";
import { toast } from "sonner";
import useCart from "@/hooks/useCart";

const Index = () => {
  const {
    items,
    cartId,
    loading,
    error,
    scanItem,
    removeItem,
    clearCart,
    resetCart,
  } = useCart();

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<CartItem[] | null>(null);

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Show error toast if there's an API error
  useEffect(() => {
    if (error) {
      toast.error("API Error", {
        description: error,
      });
    }
  }, [error]);

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

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      const item = items.find(i => i.id === itemId);
      if (item) {
        toast.info("Item updated", {
          description: `${item.name} quantity updated`,
        });
      }
    } catch (err) {
      toast.error("Remove failed", {
        description: err instanceof Error ? err.message : "Failed to remove item",
      });
    }
  };

  const handleReset = async () => {
    try {
      if (cartId) {
        await clearCart();
      } else {
        await resetCart();
      }
      setReceiptData(null);
      toast.info("Cart reset", {
        description: "Ready for next customer",
      });
    } catch (err) {
      toast.error("Reset failed", {
        description: err instanceof Error ? err.message : "Failed to reset cart",
      });
    }
  };

  const handleMockScan = () => {
    mockScan();
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-card-foreground">
                    Order Summary
                  </h2>
                  <div className="flex items-center gap-2 text-sm">
                    {cartId ? (
                      <>
                        <Wifi className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Pi Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Waiting for Pi</span>
                      </>
                    )}
                  </div>
                </div>
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
                onClick={handleMockScan}
                disabled={scanning}
                variant="outline"
                className="w-full gap-2 mb-4"
              >
                <Barcode className="h-5 w-5" />
                {scanning ? "Scanning..." : "Mock Scan Item"}
              </Button>

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