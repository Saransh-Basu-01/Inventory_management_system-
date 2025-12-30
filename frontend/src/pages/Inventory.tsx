import { useEffect, useState } from "react";
import { Plus, RefreshCw, ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContent";
import { ManagerOnly } from "@/components/RoleGuard";

// ═══════════════════════════════════════════════════════════════════
// TYPES - Match your backend response exactly!
// ═══════════════════════════════════════════════════════════════════

interface Product {
  id:  number;
  name:  string;
  sku: string;
  quantity: number;
  price: number;
}

interface InventoryTransaction {
  id: number;
  product_id: number;
  transaction_type: string;
  quantity: number;
  unit_price:  number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string | null;
  // Product can be nested or separate
  product?:  Product | null;
  product_name?: string;
  product_sku?:  string;
}

// ═══════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════

const transactionSchema = z. object({
  product_id: z. number().min(1, "Product is required"),
  transaction_type: z. enum(["stock_in", "stock_out", "adjustment", "return"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function Inventory() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { canCreate, isStaff } = useAuth();

  const form = useForm<TransactionFormData>({
    resolver:  zodResolver(transactionSchema) as any,
    defaultValues: {
      product_id:  0,
      transaction_type: "stock_in",
      quantity: 1,
      unit_price: 0,
      notes: "",
    },
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory-transactions");
      
      // Debug - see what backend returns
      console. log("API Response:", res.data);
      
      // Handle different response formats
      let data = res.data;
      
      // If response is wrapped in an object
      if (data && data.items) {
        data = data.items;
      }
      if (data && data. data) {
        data = data.data;
      }
      
      // Make sure it's an array
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error("Unexpected data format:", data);
        setTransactions([]);
      }
    } catch (error) {
      console. error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const res = await api. get("/products");
      let data = res.data;
      if (data && data. items) data = data.items;
      if (data && data.data) data = data.data;
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchProducts();
  }, []);

  // Handle create
  const handleCreate = () => {
    form.reset({
      product_id: 0,
      transaction_type:  "stock_in",
      quantity: 1,
      unit_price: 0,
      notes:  "",
    });
    setIsFormOpen(true);
  };

  // Submit form
  const onSubmit = async (data: TransactionFormData) => {
    try {
      await api.post("/inventory-transactions", data);
      setIsFormOpen(false);
      fetchTransactions();
      fetchProducts();
    } catch (error:  any) {
      alert(error.response?.data?.detail || "Failed to create transaction");
    }
  };

  // Get product name helper
  const getProductName = (tx: InventoryTransaction): string => {
    // Try different ways product data might come
    if (tx.product?. name) return tx.product.name;
    if (tx.product_name) return tx.product_name;
    
    // Find from products list
    const product = products.find(p => p.id === tx.product_id);
    if (product) return product.name;
    
    return `Product #${tx.product_id}`;
  };

  // Get product SKU helper
  const getProductSku = (tx: InventoryTransaction): string => {
    if (tx.product?. sku) return tx.product.sku;
    if (tx.product_sku) return tx.product_sku;
    
    const product = products.find(p => p. id === tx.product_id);
    if (product) return product.sku;
    
    return "";
  };

  // Get transaction type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "stock_in": 
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <ArrowUpCircle className="h-3 w-3 mr-1" />
            Stock In
          </Badge>
        );
      case "stock_out": 
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <ArrowDownCircle className="h-3 w-3 mr-1" />
            Stock Out
          </Badge>
        );
      case "adjustment":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Adjustment
          </Badge>
        );
      case "return": 
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Return
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString?:  string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year:  "numeric",
        month: "short",
        day:  "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const productName = getProductName(tx).toLowerCase();
    const productSku = getProductSku(tx).toLowerCase();
    const matchesSearch = productName.includes(searchTerm.toLowerCase()) ||
                          productSku.includes(searchTerm. toLowerCase());
    const matchesType = filterType === "all" || tx. transaction_type === filterType;
    return matchesSearch && matchesType;
  });

  // Stats
  const stockInCount = transactions.filter(t => t.transaction_type === "stock_in").length;
  const stockOutCount = transactions.filter(t => t.transaction_type === "stock_out").length;
  const adjustmentCount = transactions.filter(t => t. transaction_type === "adjustment").length;
  const returnCount = transactions.filter(t => t.transaction_type === "return").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Transactions</h1>
          <p className="text-gray-500">
            Track stock movements
            {isStaff && <Badge variant="outline" className="ml-2">View Only</Badge>}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <ManagerOnly>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </ManagerOnly>
        </div>
      </div>

      {/* Staff notice */}
      {isStaff && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
          👁️ You have <strong>view-only</strong> access.  Contact an admin or manager to record transactions.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Stock In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stockInCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Stock Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stockOutCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{adjustmentCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{returnCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock_in">Stock In</SelectItem>
            <SelectItem value="stock_out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="return">Return</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debug info - remove after fixing */}
      {transactions.length === 0 && ! loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-4">
          💡 No transactions found. Check browser console (F12) for API response.  
          Create a new transaction using the "Add Transaction" button. 
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading... 
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(tx.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getProductName(tx)}</div>
                    <div className="text-xs text-gray-500">{getProductSku(tx)}</div>
                  </TableCell>
                  <TableCell>{getTypeBadge(tx.transaction_type)}</TableCell>
                  <TableCell>
                    <span className={
                      tx.transaction_type === "stock_in" || tx.transaction_type === "return"
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }>
                      {tx. transaction_type === "stock_in" || tx.transaction_type === "return" ?  "+" : "-"}
                      {tx.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tx.unit_price != null ? `$${Number(tx.unit_price).toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    {tx.total_price != null ? `$${Number(tx.total_price).toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                    {tx.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>

      {/* Create Transaction Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Inventory Transaction</DialogTitle>
          </DialogHeader>

          <Form {... form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <Select
                      value={field.value ?  field.value. toString() : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.length === 0 ? (
                          <SelectItem value="0" disabled>No products available</SelectItem>
                        ) : (
                          products.map((p) => (
                            <SelectItem key={p.id} value={p.id. toString()}>
                              {p.name} ({p.sku}) - Stock: {p.quantity}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stock_in">
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            Stock In - Add inventory
                          </div>
                        </SelectItem>
                        <SelectItem value="stock_out">
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            Stock Out - Remove inventory
                          </div>
                        </SelectItem>
                        <SelectItem value="adjustment">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-yellow-500" />
                            Adjustment - Correct stock count
                          </div>
                        </SelectItem>
                        <SelectItem value="return">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-blue-500" />
                            Return - Customer return
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form. control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0. 00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form. control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this transaction..."
                        {... field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Transaction</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}