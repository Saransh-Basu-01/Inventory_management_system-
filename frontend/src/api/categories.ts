import api from './axios'

export interface Category {
    id:number;
    name:string;
    description:string | null
}

export interface CategoryCreate {
  name: string;
  description?: string;
}

export const categoriesApi={
    getAll:async()=>{
        const response=await api.get<Category[]>("/categories")
        return response.data;
    },
    getById: async (id: number) => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
    },

  create: async (data: CategoryCreate) => {
    const response = await api.post<Category>("/categories", data);
    return response.data;
    },

  update: async (id: number, data: Partial<CategoryCreate>) => {
    const response = await api.patch<Category>(`/categories/${id}`, data);
    return response.data;
    },

  delete: async (id: number) => {
    await api.delete(`/categories/${id}`);
     },

}