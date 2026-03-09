import { useState, useCallback, useEffect, useRef } from 'react';
import { CartItem } from '@/types/cart';
import { apiService, CartResponse, DetectResponse } from '@/services/api';

const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convert API cart items to frontend CartItem format
  const convertAPIToCartItem = (apiItem: any): CartItem => ({
    id: `${apiItem.tag_id}`,
    name: apiItem.name,
    quantity: apiItem.quantity,
    unitPrice: apiItem.price,
    totalPrice: apiItem.subtotal,
    scannedAt: new Date(),
  });

  // Load existing cart
  const loadCart = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const cartData: CartResponse = await apiService.getCart(id);
      setCartId(cartData.cart_id);
      setItems(cartData.items.map(convertAPIToCartItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load cart-001 on mount (matches Pi CART_ID)
  useEffect(() => {
    loadCart('cart-001');
  }, [loadCart]);

  // Auto-refresh cart data
  useEffect(() => {
    if (cartId) {
      // Set up polling every 2 seconds
      intervalRef.current = setInterval(async () => {
        try {
          const cartData: CartResponse = await apiService.getCart(cartId);
          setItems(cartData.items.map(convertAPIToCartItem));
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }, 2000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [cartId]);

  // Scan item (detect tag)
  const scanItem = useCallback(async (tagId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response: DetectResponse = await apiService.detectTag(cartId || undefined, tagId);
      setCartId(response.cart_id);
      
      // Reload cart to get updated items
      await loadCart(response.cart_id);
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, loadCart]);

  // Remove item (decrement quantity) - calls backend API
  const removeItem = useCallback(async (itemId: string) => {
    if (!cartId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Call backend to remove/decrement item
      await apiService.removeItem(cartId, parseInt(itemId));
      
      // Reload cart to get updated state
      await loadCart(cartId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cartId, loadCart]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!cartId) return;
    
    setLoading(true);
    setError(null);
    try {
      await apiService.clearCart(cartId);
      setItems([]);
      setCartId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  // Reset cart - clears backend and starts fresh
  const resetCart = useCallback(async () => {
    // First clear the backend cart if it exists
    if (cartId) {
      try {
        await apiService.clearCart(cartId);
      } catch (err) {
        // If clearing fails, continue with local reset
        console.error('Failed to clear backend cart:', err);
      }
    }
    
    // Then reset local state and reload cart-001
    setItems([]);
    setCartId(null);
    setError(null);
    
    // Reload cart-001 after a short delay
    setTimeout(() => {
      loadCart('cart-001');
    }, 500);
  }, [cartId, loadCart]);

  return {
    items,
    cartId,
    loading,
    error,
    loadCart,
    scanItem,
    removeItem,
    clearCart,
    resetCart,
  };
};

export default useCart;
