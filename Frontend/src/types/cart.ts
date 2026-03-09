export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  scannedAt: Date;
  imageUrl?: string;
}
