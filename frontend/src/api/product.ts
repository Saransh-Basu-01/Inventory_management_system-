import api from './axios'

export interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  reorder_level: number | null;
  supplier_id: number;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

export interface ProductCreate {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  reorder_level?: number;
  supplier_id: number;
  category_id?: number;
}

export const productsApi={
    getAll:async()=>{
        const response=await api.get<Product[]>("/products");
        return response.data;
    },
    getById: async (id: number) => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
    },

    create: async (data: ProductCreate) => {
    const response = await api.post<Product>("/products", data);
    return response.data;
    },

    update: async (id: number, data: Partial<ProductCreate>) => {
        const response = await api.patch<Product>(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/products/${id}`);
    },
}