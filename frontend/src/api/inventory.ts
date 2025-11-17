import api from "./axios";

export type TransactionType = "stock_in" | "stock_out" | "adjustment" | "return";

export interface InventoryTransactionCreate {
  product_id: number;
  transaction_type: TransactionType;
  quantity: number;
  unit_price?: number | null;
  total_price?: number | null;
  reference_number?: string | null;
  notes?: string | null;
}

export interface InventoryTransactionResponse {
  id: number;
  product_id: number;
  transaction_type: TransactionType;
  quantity: number;
  unit_price?: number | null;
  total_price?: number | null;
  reference_number?: string | null;
  notes?: string | null;
  created_at?: string | null;
  // backend may include nested product
  product?: { id: number; name?: string; sku?: string } | null;
}

export const inventoryApi = {
  getAll: async (params?: { skip?: number; limit?: number }) => {
    const response = await api.get<InventoryTransactionResponse[]>("/inventory-transactions", { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<InventoryTransactionResponse>(`/inventory-transactions/${id}`);
    return response.data;
  },

  create: async (payload: InventoryTransactionCreate) => {
    const response = await api.post<InventoryTransactionResponse>("/inventory-transactions", payload);
    return response.data;
  },

  // add update/delete if you later implement them on backend
};

export interface ProductSummary {
  id: number;
  name: string;
  sku?: string | null;
  quantity?: number | null;
}

export const productsApi = {
  getAll: async () => {
    const response = await api.get<ProductSummary[]>("/products");
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ProductSummary>(`/products/${id}`);
    return response.data;
  },
};

export default inventoryApi;