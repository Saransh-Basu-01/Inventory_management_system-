import api from "./axios";

export interface SaleItemCreate {
  product_id: number;
  quantity: number;
  unit_price?: number;
}

export interface SaleCreate {
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  payment_method?: string | null;
  date?: string | null;
  items: SaleItemCreate[];
  notes?: string | null;
  total?: number;
}

export interface SaleItemResponse {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price?: number | null;
  total_price?: number | null;
  product?: { id: number; name?: string; sku?: string } | null;
}

export interface SaleResponse {
  id: number;
  invoice_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  payment_method?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
  notes?: string | null;
  sale_items?: SaleItemResponse[] | null;
date?: string | null;
}

export interface SaleTransactionResponse {
  sale_id: number;
  invoice_number: string;
  total_amount: number;
  total_items: number;
  customer_name?: string | null;
  created_at: string;
  message: string;
}

export const salesApi = {
  getAll: async () => {
    const response = await api.get<SaleResponse[]>("/sales");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<SaleResponse>(`/sales/${id}`);
    return response.data;
  },

  create: async (payload: SaleCreate) => {
    const response = await api.post<SaleTransactionResponse>("/sales", payload);
    return response.data;
  },
};

export default salesApi;