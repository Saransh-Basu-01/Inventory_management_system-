import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { salesApi, type SaleCreate, type SaleResponse } from "@/api/sale";

/**
 * Sales page using shadcn UI, react-hook-form and zod.
 * Place at: frontend/src/pages/sales/Sales.tsx
 */

// Zod schemas
const saleItemSchema = z.object({
  product_id: z.coerce.number().int().positive("Select a product"),
  quantity: z.coerce.number().int().min(1, "Quantity must be >= 1"),
  unit_price: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "number") return v;
      const s = String(v).trim();
      return s === "" ? undefined : Number(s);
    }),
});

const saleSchema = z.object({
  customer_name: z.string().max(100).optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().max(20).optional(),
  payment_method: z.string().max(50).optional(),
  date: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
  notes: z.string().max(255).optional(),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      payment_method: "",
      date: new Date().toISOString().slice(0, 10),
      items: [{ product_id: undefined as unknown as number, quantity: 1, unit_price: undefined }],
      notes: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Fetch products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await productsApi.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load products", err);
      setError("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch sales
  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesApi.getAll();
      setSales(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load sales", err);
      setError("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productsMap = useMemo(() => {
    const m = new Map<number, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sales.slice().sort((a, b) => (b.id - a.id));
    return sales.filter((s) => {
      const t = (s.customer_name ?? "").toLowerCase();
      const date = (s.date ?? s.created_at ?? "").toLowerCase();
      const matchBasic = t.includes(term) || date.includes(term) || String(s.id).includes(term) || (s.invoice_number ?? "").toLowerCase().includes(term);
      if (matchBasic) return true;
      if (!s.sale_items) return false;
      return s.sale_items.some((it) => {
        const prod = it.product ?? productsMap.get(it.product_id);
        const name = (prod?.name ?? "").toLowerCase();
        const sku = (prod?.sku ?? "").toLowerCase();
        return name.includes(term) || sku.includes(term);
      });
    }).sort((a, b) => (b.id - a.id));
  }, [sales, productsMap, search]);

  const openCreate = () => {
    form.reset({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      payment_method: "",
      date: new Date().toISOString().slice(0, 10),
      items: [{ product_id: undefined as unknown as number, quantity: 1, unit_price: undefined }],
      notes: "",
    });
    setShowDialog(true);
  };

  const handleAddItem = () => {
    append({ product_id: undefined as unknown as number, quantity: 1, unit_price: undefined });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length === 1) {
      replace([{ product_id: undefined as unknown as number, quantity: 1, unit_price: undefined }]);
    } else {
      remove(index);
    }
  };

  const computeTotals = (values: SaleFormValues) => {
    const items = values.items || [];
    let subtotal = 0;
    for (const it of items) {
      const price = it.unit_price ?? productsMap.get(it.product_id)?.price ?? 0;
      subtotal += Number(price) * Number(it.quantity);
    }
    return { subtotal, total: subtotal };
  };

  const handleSubmit = async (values: SaleFormValues) => {
    setError(null);

    // client-side stock check
    for (const it of values.items) {
      const p = productsMap.get(it.product_id);
      if (p && typeof p.quantity === "number" && it.quantity > p.quantity) {
        const ok = window.confirm(`Product "${p.name}" has only ${p.quantity} in stock but you're selling ${it.quantity}. Proceed?`);
        if (!ok) return;
      }
    }

    const payload: SaleCreate = {
      customer_name: values.customer_name || undefined,
      customer_email: values.customer_email || undefined,
      customer_phone: values.customer_phone || undefined,
      payment_method: values.payment_method || undefined,
      date: values.date || undefined,
      items: values.items.map((it) => ({
        product_id: Number(it.product_id),
        quantity: Number(it.quantity),
        unit_price: it.unit_price ?? productsMap.get(it.product_id)?.price ?? undefined,
      })),
      notes: values.notes || undefined,
      total: computeTotals(values).total,
    };

    setSaving(true);
    try {
      const res = await salesApi.create(payload);
      // Optionally show returned invoice info
      alert(`Sale created: ${res.invoice_number} — ${res.message}`);
      await fetchSales();
      await fetchProducts();
      setShowDialog(false);
    } catch (err: any) {
      console.error("Failed to create sale", err);
      setError(err?.response?.data?.detail || err?.message || "Failed to create sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales</h1>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, invoice, date or product..."
            className="min-w-[320px]"
          />
          <Button variant="outline" onClick={() => { fetchSales(); fetchProducts(); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Sale
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        {loading || loadingProducts ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {/* <TableHead>ID</TableHead> */}
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No sales found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    {/* <TableCell className="font-medium">{s.id}</TableCell> */}
                    <TableCell>{s.invoice_number}</TableCell>
                    <TableCell>{s.customer_name ?? "—"}</TableCell>
                    <TableCell>{s.date ?? s.created_at ?? "—"}</TableCell>
                    <TableCell className="text-right">{s.sale_items?.length ?? 0}</TableCell>
                    <TableCell className="text-right">
                      {s.total_amount != null ? `$${Number(s.total_amount).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>{s.payment_method ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableCaption>Showing {filtered.length} of {sales.length} sales</TableCaption>
          </Table>
        )}
      </div>

      {/* Create Sale Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Items</h3>
                  <Button variant="ghost" onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" /> Add item
                  </Button>
                </div>

                <div className="space-y-2">
                  {fields.map((fieldItem, idx) => (
                    <div key={fieldItem.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <FormField
                          control={form.control}
                          name={`items.${idx}.product_id` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value ? String(field.value) : ""}
                                  onValueChange={(val) => {
                                    field.onChange(Number(val));
                                    const p = productsMap.get(Number(val));
                                    if (p) {
                                      form.setValue(`items.${idx}.unit_price` as any, p.price ?? undefined);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((p) => (
                                      <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name} {p.sku ? `(${p.sku})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${idx}.quantity` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qty</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  value={field.value ?? 1}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${idx}.unit_price` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-1">
                        <FormItem>
                          <FormLabel>Subtotal</FormLabel>
                          <div className="pt-2">
                            {(() => {
                              const it = form.getValues(`items.${idx}` as any);
                              const price = it.unit_price ?? productsMap.get(it.product_id)?.price ?? 0;
                              const qty = Number(it.quantity ?? 0);
                              const sub = Number(price) * qty;
                              return <div className="font-medium">${sub.toFixed(2)}</div>;
                            })()}
                          </div>
                        </FormItem>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" onClick={() => handleRemoveItem(idx)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Subtotal</div>
                    <div className="text-2xl font-semibold">
                      {(() => {
                        const vals = form.getValues();
                        const { subtotal } = computeTotals(vals as SaleFormValues);
                        return `$${subtotal.toFixed(2)}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Create Sale"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}