const API_BASE_URL = 'http://localhost:5000/api';

export interface Product {
  tag_id: number;
  name: string;
  price: number;
}

export interface CartItemAPI {
  tag_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  cart_id: string;
  items: CartItemAPI[];
  total: number;
  item_count: number;
}

export interface DetectResponse {
  msg: string;
  cart_id: string;
  product: {
    tag_id: number;
    name: string;
    price: number;
    quantity: number;
  };
}

class APIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getProducts(): Promise<Product[]> {
    return this.get<Product[]>('/products');
  }

  async addProduct(product: Omit<Product, 'tag_id'> & { tag_id: number }): Promise<{ msg: string; id: number }> {
    return this.post('/products', product);
  }

  async detectTag(cartId?: string, tagId?: number): Promise<DetectResponse> {
    return this.post('/detect', { cart_id: cartId, tag_id: tagId });
  }

  async getCart(cartId: string): Promise<CartResponse> {
    return this.get(`/cart/${cartId}`);
  }

  async clearCart(cartId: string): Promise<{ msg: string; items_removed: number }> {
    return this.post(`/cart/${cartId}/clear`, {});
  }

  async removeItem(cartId: string, tagId: number): Promise<{ msg: string; tag_id: number; product: any }> {
    return this.post(`/cart/${cartId}/remove`, { tag_id: tagId });
  }
}

export const apiService = new APIService();
