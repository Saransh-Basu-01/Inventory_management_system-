import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { productsApi, type Product } from "@/api/product";
import { suppliersApi, type Supplier } from "@/api/supplier";
import { categoriesApi, type Category } from "@/api/categories";

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
    price: z.coerce.number().min(0, "Price must be 0 or greater"),
    reorder_level: z.coerce.number().min(0).optional(),
    supplier_id: z.number().min(1, "Supplier is required"),  // Changed from z.coerce
    category_id: z.number().optional(),  // Changed from z.coerce
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [showLowStock, setShowLowStock] = useState(false);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: "",
            sku: "",
            quantity: 0,
            price: 0,
            reorder_level: 0,
            supplier_id: 0,
            category_id: 0,
        },
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productsApi.getAll();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
            alert("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await suppliersApi.getAll();
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await categoriesApi.getAll();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
        fetchCategories();
    }, []);

    const handleCreate = () => {
        setEditingProduct(null);
        form.reset({
            name: "",
            sku: "",
            quantity: 0,
            price: 0,
            reorder_level: 0,
            supplier_id: 0,
            category_id: 0,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);

        console.log("Editing product:", product); // DEBUG

        form.reset({
            name: product.name,
            sku: product.sku,
            quantity: product.quantity,
            price: product.price,
            reorder_level: product.reorder_level || 0,
            supplier_id: product.supplier_id,  // Make sure this is a number
            category_id: product.category_id || undefined,  // undefined if null
        });

        console.log("Form values after reset:", form.getValues()); // DEBUG

        setIsFormOpen(true);
    };
   const onSubmit = async (data: ProductFormData) => {
  try {
    console.log("📤 Form data (raw):", data);
    console.log("📤 supplier_id:", data.supplier_id, typeof data.supplier_id);
    console.log("📤 category_id:", data.category_id, typeof data.category_id);

    const cleanData = {
      name: data.name,
      sku: data.sku,
      quantity: Number(data.quantity),
      price: Number(data.price),
      reorder_level: data.reorder_level ? Number(data.reorder_level) : undefined,
      supplier_id: Number(data.supplier_id),
      category_id: data.category_id ? Number(data.category_id) : undefined,
    };

    console.log("📤 Clean data being sent:", cleanData);

    if (editingProduct) {
      const result = await productsApi.update(editingProduct.id, cleanData);
      console.log("✅ Update result:", result);
    } else {
      const result = await productsApi.create(cleanData);
      console.log("✅ Create result:", result);
    }
    
    setIsFormOpen(false);
    await fetchProducts();
  } catch (error: any) {
    console.error("❌ Error:", error);
    console.error("❌ Response:", error.response?.data);
    alert(`Failed to save product: ${error.response?.data?.detail || error.message}`);
  }
};
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await productsApi.delete(deleteId);
            setDeleteId(null);
            fetchProducts();
        } catch (error: any) {
            console.error("Error deleting product:", error);
            const errorMsg = error.response?.data?.detail || error.message;

            // Show user-friendly message
            if (errorMsg.includes("has been sold")) {
                alert("❌ Cannot delete this product because it has sales history.\n\nTip: You can edit it to mark as discontinued instead.");
            } else {
                alert(`Failed to delete product: ${errorMsg}`);
            }

            setDeleteId(null); // Close dialog even if deletion fails
        }
    }

    // Filter products
    const filteredProducts = products.filter((product) => {
        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchName = product.name.toLowerCase().includes(search);
            const matchSku = product.sku.toLowerCase().includes(search);
            if (!matchName && !matchSku) return false;
        }

        // Category filter
        if (selectedCategory !== "all") {
            if (product.category_id?.toString() !== selectedCategory) return false;
        }

        // Low stock filter
        if (showLowStock) {
            const reorderLevel = product.reorder_level || 0;
            if (product.quantity >= reorderLevel) return false;
        }

        return true;
    });

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Products</h1>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant={showLowStock ? "default" : "outline"}
                    onClick={() => setShowLowStock(!showLowStock)}
                >
                    Low Stock Only
                </Button>
            </div>

            {/* Table */}
            {filteredProducts.length > 0 ? (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => {
                                const isLowStock = product.reorder_level
                                    ? product.quantity < product.reorder_level
                                    : false;

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                {product.sku}
                                            </code>
                                        </TableCell>
                                        <TableCell>{product.category?.name || "—"}</TableCell>
                                        <TableCell>{product.supplier?.name || "—"}</TableCell>
                                        <TableCell className="text-right">
                                            {isLowStock ? (
                                                <Badge variant="destructive">{product.quantity}</Badge>
                                            ) : (
                                                <span>{product.quantity}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${product.price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(product.id)}>
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    {searchTerm || selectedCategory !== "all" || showLowStock
                        ? "No products match your filters"
                        : "No products found. Create your first product!"}
                </div>
            )}

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Product name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SKU-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="quantity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Quantity *</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price *</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" min="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="reorder_level"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reorder Level</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="supplier_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier *</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                console.log("Supplier changed to:", value); // DEBUG
                                                field.onChange(Number(value));
                                            }}
                                            value={field.value ? field.value.toString() : ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a supplier" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                console.log("Category changed to:", value); // DEBUG
                                                const numValue = value === "0" ? undefined : Number(value);
                                                field.onChange(numValue);
                                            }}
                                            value={field.value ? field.value.toString() : "0"}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category (optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="0">None</SelectItem>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id.toString()}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}