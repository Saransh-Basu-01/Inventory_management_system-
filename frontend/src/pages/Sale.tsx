import { useEffect, useState } from "react";
import { Plus, RefreshCw, ShoppingCart, Trash2, Receipt, Eye } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
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
  DialogTitle, DialogFooter, DialogDescription
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContent";
import { ManagerOnly } from "@/components/RoleGuard";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Product {
  id:  number;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface SaleItem {
  id: number;
  product_id: number;
  quantity:  number;
  unit_price: number;
  total_price: number;
  product?:  {
    id: number;
    name: string;
    sku: string;
  } | null;
}

interface Sale {
  id:  number;
  invoice_number: string;
  customer_name?:  string | null;
  total_amount: number;
  created_at: string;
  user_id?:  number;
  sale_items?: SaleItem[]; 
  items?:  SaleItem[];
}

// ═══════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════

const saleItemSchema = z.object({
  product_id: z.number().min(1, "Select a product"),
  quantity: z.coerce.number().min(1, "Minimum 1"),
});

const saleSchema = z.object({
  customer_name: z. string().optional(),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
});

type SaleFormData = z.infer<typeof saleSchema>;

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { isStaff } = useAuth();

  const form = useForm<SaleFormData>({
    resolver:  zodResolver(saleSchema) as any,
    defaultValues: {
      customer_name:  "",
      items:  [{ product_id:  0, quantity:  1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control:  form.control,
    name: "items",
  });

  // Fetch sales
  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales");
      setSales(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await api. get("/products");
      const data = Array.isArray(res.data) ? res.data : res.data?. items || [];
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  // Handle create
  const handleCreate = () => {
    form.reset({
      customer_name: "",
      items: [{ product_id: 0, quantity: 1 }],
    });
    setError(null);
    setIsFormOpen(true);
  };

  // View sale details
  const handleViewSale = async (saleId:  number) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedSale(res. data);
    } catch (error) {
      console.error("Error fetching sale details:", error);
      const saleFromList = sales.find(s => s. id === saleId);
      if (saleFromList) setSelectedSale(saleFromList);
    }
  };

  // Get product by ID
  const getProduct = (productId: number): Product | undefined => {
    return products. find(p => p.id === productId);
  };

  // Calculate total
  const calculateTotal = (): number => {
    const items = form.watch("items");
    return items.reduce((total, item) => {
      const product = getProduct(item.product_id);
      if (product && item.quantity) {
        return total + (product.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const onSubmit = async (data: SaleFormData) => {
  setIsSubmitting(true);
  setError(null);

  try {
    // Filter out items with no product selected
    const validItems = data.items. filter(item => item.product_id > 0);
    
    if (validItems.length === 0) {
      setError("Please select at least one product");
      setIsSubmitting(false);
      return;
    }

    // Build items with unit_price from product
    const itemsWithPrice = [];
    
    for (const item of validItems) {
      const product = getProduct(item.product_id);
      
      if (!product) {
        setError(`Product not found`);
        setIsSubmitting(false);
        return;
      }
      
      if (item.quantity > product.quantity) {
        setError(`Insufficient stock for "${product.name}".  Available: ${product.quantity}`);
        setIsSubmitting(false);
        return;
      }
      
      itemsWithPrice.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,  // ← ADD THIS! 
      });
    }

    const payload = {
      customer_name: data. customer_name || null,
      items:  itemsWithPrice,
    };

    console.log("Creating sale with payload:", JSON.stringify(payload, null, 2));

    await api.post("/sales", payload);
    setIsFormOpen(false);
    form.reset();
    fetchSales();
    fetchProducts();
  } catch (err:  any) {
    console.error("Error creating sale:", err);
    console.error("Response:", err.response?. data);
    
    const message = err.response?. data?.detail;
    if (typeof message === "string") {
      setError(message);
    } else if (Array.isArray(message)) {
      setError(message. map((m: any) => m.msg || JSON.stringify(m)).join(", "));
    } else {
      setError("Failed to create sale.  Please try again.");
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year:  "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount:  number) => {
    return new Intl. NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Filter sales
  const filteredSales = sales.filter((sale) =>
    sale.invoice_number?. toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalSalesCount = sales.length;
  const averageSale = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  // Get sale items helper
  const getSaleItems = (sale: Sale | null): SaleItem[] => {
    if (! sale) return [];
     const items = sale.sale_items || sale.items || [];
  
    console.log("Sale items:", items);  // Debug
  
  return items;
  };

  // Get product name from item
  const getProductName = (item: SaleItem): string => {
    if (item.product?. name) return item.product.name;
    const product = getProduct(item.product_id);
    return product?. name || `Product #${item.product_id}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Sales
          </h1>
          <p className="text-gray-500">
            Manage sales transactions
            {isStaff && <Badge variant="outline" className="ml-2">View Only</Badge>}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSales}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <ManagerOnly>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </ManagerOnly>
        </div>
      </div>

      {/* Staff notice */}
      {isStaff && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
          👁️ You have <strong>view-only</strong> access. 
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageSale)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by invoice number or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                  Loading... 
                </TableCell>
              </TableRow>
            ) : filteredSales.length === 0 ?  (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {sale.invoice_number}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(sale. created_at)}
                  </TableCell>
                  <TableCell>{sale.customer_name || "Walk-in Customer"}</TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSale(sale.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredSales.length} of {sales.length} sales
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CREATE SALE DIALOG - Fixed accessibility */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              New Sale
            </DialogTitle>
            <DialogDescription>
              Create a new sale by selecting products and quantities.
            </DialogDescription>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Form {... form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Customer Name */}
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Walk-in Customer" {... field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sale Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold">Items</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product_id:  0, quantity:  1 })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => {
                  const selectedProduct = getProduct(form.watch(`items.${index}.product_id`));
                  const quantity = form.watch(`items.${index}. quantity`) || 0;
                  const subtotal = selectedProduct ? selectedProduct. price * quantity : 0;

                  return (
                    <div key={field.id} className="flex gap-3 items-end p-4 border rounded-lg bg-gray-50">
                      {/* Product Select */}
                      <FormField
                        control={form. control}
                        name={`items.${index}.product_id`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Product</FormLabel>
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
                                {products
                                  .filter(p => p. quantity > 0)
                                  .map((p) => (
                                    <SelectItem key={p.id} value={p. id. toString()}>
                                      {p. name} - {formatCurrency(p.price)} 
                                      {/* (Stock: {p.quantity}) */}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max={selectedProduct?.quantity || 999}
                                {... field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subtotal */}
                      <div className="w-24 text-right pb-2">
                        <div className="text-xs text-gray-500">Subtotal</div>
                        <div className="font-semibold">{formatCurrency(subtotal)}</div>
                      </div>

                      {/* Remove Button */}
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 mb-2"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateTotal())}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VIEW SALE DETAILS DIALOG - Fixed accessibility */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!! selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Sale Details
            </DialogTitle>
            <DialogDescription>
              View complete details of this sale transaction.
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Invoice Number</div>
                  <div className="font-medium font-mono">{selectedSale. invoice_number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{formatDate(selectedSale.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Customer</div>
                  <div className="font-medium">{selectedSale.customer_name || "Walk-in Customer"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="font-medium text-green-600 text-lg">
                    {formatCurrency(selectedSale.total_amount)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="text-sm font-semibold mb-2 flex items-center justify-between">
                  <span>Items</span>
                  <Badge variant="outline">
                    {getSaleItems(selectedSale).length} item(s)
                  </Badge>
                </div>
                
                {getSaleItems(selectedSale).length === 0 ?  (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    No items found for this sale. 
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSaleItems(selectedSale).map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell className="font-medium">
                              {getProductName(item)}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item. total_price)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Total Footer */}
              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Grand Total</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedSale.total_amount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSale(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}