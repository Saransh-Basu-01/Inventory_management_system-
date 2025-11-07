import api from "./axios";

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface SupplierCreate {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const suppliersApi = {
  getAll: async () => {
    const response = await api.get<Supplier[]>("/suppliers");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data: SupplierCreate) => {
    const response = await api.post<Supplier>("/suppliers", data);
    return response.data;
  },

  update: async (id: number, data: Partial<SupplierCreate>) => {
    const response = await api.patch<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/suppliers/${id}`);
  },
};