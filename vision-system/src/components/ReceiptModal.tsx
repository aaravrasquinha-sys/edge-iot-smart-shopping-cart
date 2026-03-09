import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem } from "@/types/cart";
import { CheckCircle, Download, X } from "lucide-react";
import { toast } from "sonner";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  totalAmount: number;
}

const ReceiptModal = ({ open, onOpenChange, items, totalAmount }: ReceiptModalProps) => {
  const currentDate = new Date();
  const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;

  const handleDownload = () => {
    toast.success("Receipt downloaded", {
      description: "Your receipt has been saved",
    });
    // In a real implementation, this would trigger a PDF download
  };

  const handlePrint = () => {
    window.print();
    toast.success("Printing receipt", {
      description: "Sending receipt to printer",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Digital Receipt</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Message */}
          <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-semibold text-success">Payment Successful</p>
              <p className="text-sm text-muted-foreground">
                Thank you for shopping with us!
              </p>
            </div>
          </div>

          {/* Receipt Header */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground">GrabCart</h3>
            <p className="text-sm text-muted-foreground">by Aarav Rasquinha and Jai Pareek</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {currentDate.toLocaleDateString()} {currentDate.toLocaleTimeString()}
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Receipt #: {receiptNumber}
            </p>
          </div>

          <Separator />

          {/* Items List */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × AED {item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground">
                    AED {item.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">AED {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (0%)</span>
              <span className="text-foreground">AED 0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">Total Paid</span>
              <span className="text-success">AED {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              Print Receipt
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Have a great day!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;
