import api from "./axios";

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalSales: number;
  totalRevenue: number;
  recentTransactions: number;
}

export interface ProductSummary {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  reorder_level: number;
  category?:  { id: number; name: string } | null;
  supplier?: { id: number; name: string } | null;
}

export interface SaleSummary {
  id: number;
  invoice_number: string;
  customer_name?:  string | null;
  total_amount: number;
  created_at: string;
}

export interface TransactionSummary {
  id: number;
  product_id: number;
  transaction_type: string;
  quantity: number;
  unit_price?:  number | null;
  total_price?:  number | null;
  created_at?:  string | null;
  product?:  { id: number; name?:  string; sku?: string } | null;
}

export interface CategorySummary {
  id: number;
  name: string;
  description?: string | null;
}

export const dashboardApi = {
  getProducts: async (): Promise<ProductSummary[]> => {
    const response = await api. get<ProductSummary[]>("/products");
    return response.data;
  },

  getSales: async (): Promise<SaleSummary[]> => {
    const response = await api.get<SaleSummary[]>("/sales");
    return response. data;
  },

  getTransactions: async (): Promise<TransactionSummary[]> => {
    const response = await api.get<TransactionSummary[]>("/inventory-transactions");
    return response.data;
  },

  getCategories: async (): Promise<CategorySummary[]> => {
    const response = await api.get<CategorySummary[]>("/categories");
    return response. data;
  },

  getSuppliers: async () => {
    const response = await api. get("/suppliers");
    return response.data;
  },
};

export default dashboardApi;