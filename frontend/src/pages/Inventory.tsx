import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
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
import {
  inventoryApi,
  type InventoryTransactionCreate,
  type InventoryTransactionResponse,
} from "@/api/inventory";

const txSchema = z.object({
  product_id: z.coerce.number().int().positive({ message: "Select a product" }),
  transaction_type: z.enum(["stock_in", "stock_out", "adjustment", "return"]),
  quantity: z.coerce.number().int().min(1, { message: "Quantity must be at least 1" }),
  unit_price: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (typeof v === "number") return v;
      const s = String(v).trim();
      return s === "" ? undefined : Number(s);
    }),
  reference_number: z.string().max(100).optional(),
  notes: z.string().max(255).optional(),
});

type TxFormValues = z.infer<typeof txSchema>;

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionsUnavailable, setTransactionsUnavailable] = useState(false);
  const [transactionsUnavailableMessage, setTransactionsUnavailableMessage] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | string>("all");
  const [saving, setSaving] = useState(false);

  const form = useForm<TxFormValues>({
    resolver: zodResolver(txSchema) as any,
    defaultValues: {
      product_id: undefined as unknown as number,
      transaction_type: "stock_in",
      quantity: 1,
      unit_price: undefined,
      reference_number: undefined,
      notes: undefined,
    },
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

  // Fetch transactions with fallback/logging
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    setTransactionsUnavailable(false);
    setTransactionsUnavailableMessage(null);

    try {
      const data = await inventoryApi.getAll();
      setTransactions(Array.isArray(data) ? data : []);
      return;
    } catch (err: any) {
      console.error("inventoryApi.getAll error:", err);

      const status = err?.response?.status;

      if (status === 500) {
        // Try a raw fetch to capture server text response for debugging
        try {
          const base = (window as any)?.__env__?.VITE_API_BASE || import.meta.env.VITE_API_BASE || "";
          const url = base ? `${base.replace(/\/$/, "")}/api/v1/inventory-transactions` : `/api/v1/inventory-transactions`;
          const rawResp = await fetch(url, { method: "GET", credentials: "include" });
          const text = await rawResp.text();
          console.group("Fallback raw fetch result for /api/v1/inventory-transactions");
          console.log("Fallback status:", rawResp.status);
          console.log("Fallback headers:", Object.fromEntries(rawResp.headers.entries()));
          console.log("Fallback body (truncated):", (text || "").slice(0, 2000));
          console.groupEnd();

          setTransactionsUnavailable(true);
          setTransactionsUnavailableMessage(
            `Server returned status ${rawResp.status}. Response preview: ${(text || "").slice(0, 1000)}`
          );
        } catch (fallbackErr) {
          console.error("Fallback fetch failed:", fallbackErr);
          setTransactionsUnavailable(true);
          setTransactionsUnavailableMessage("Server returned an error (500). Could not read server response body.");
        }
      } else if (status) {
        setError(`Server returned status ${status}`);
      } else {
        setError(err?.message || "Failed to load transactions");
      }

      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError(null);
    fetchProducts();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productsMap = useMemo(() => {
    const m = new Map<number, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = transactions.slice();

    if (filterType !== "all") {
      list = list.filter((t) => t.transaction_type === filterType);
    }

    if (term) {
      list = list.filter((t) => {
        const prod = t.product ?? productsMap.get(t.product_id);
        const name = prod?.name?.toLowerCase() ?? "";
        const sku = prod?.sku?.toLowerCase() ?? "";
        return (
          name.includes(term) ||
          sku.includes(term) ||
          String(t.id).includes(term) ||
          (t.reference_number ?? "").toLowerCase().includes(term)
        );
      });
    }

    list.sort((a, b) => {
      const ta = a.created_at ?? "";
      const tb = b.created_at ?? "";
      return tb.localeCompare(ta);
    });

    return list;
  }, [transactions, productsMap, search, filterType]);

  const checkStockOut = (productId: number, qty: number) => {
    const p = productsMap.get(productId);
    if (!p) return null;
    const current = Number(p.quantity ?? 0);
    return current - qty < 0 ? current : null;
  };

  const openNewDialog = () => {
    form.reset();
    setShowDialog(true);
  };

  const handleSubmit = async (values: TxFormValues) => {
    setError(null);

    if (values.transaction_type === "stock_out") {
      const wouldBeNegative = checkStockOut(Number(values.product_id), Number(values.quantity));
      if (wouldBeNegative !== null) {
        const confirmProceed = window.confirm(
          `This will reduce stock from ${wouldBeNegative} to ${wouldBeNegative - values.quantity}. Proceed?`
        );
        if (!confirmProceed) return;
      }
    }

    const payload: InventoryTransactionCreate = {
      product_id: Number(values.product_id),
      transaction_type: values.transaction_type,
      quantity: Number(values.quantity),
      unit_price: (values.unit_price as any) ?? undefined,
      reference_number: values.reference_number || undefined,
      notes: values.notes || undefined,
    };

    setSaving(true);
    try {
      await inventoryApi.create(payload);

      if (!transactionsUnavailable) {
        await fetchTransactions();
      } else {
        await fetchProducts();
      }

      setShowDialog(false);
      alert("Transaction saved");
    } catch (err: any) {
      console.error("Create transaction failed", err);
      const msg = err?.response?.data?.detail || err?.message || "Failed to save transaction";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleRetryTransactions = async () => {
    setTransactionsUnavailable(false);
    setTransactionsUnavailableMessage(null);
    await fetchTransactions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, sku, tx id or reference..."
            className="min-w-[320px]"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="stock_in">Stock In</SelectItem>
              <SelectItem value="stock_out">Stock Out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              fetchTransactions();
              fetchProducts();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>

          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {transactionsUnavailable && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-yellow-900">
                Transactions temporarily unavailable
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                {transactionsUnavailableMessage ||
                  "Server returned an error while loading transactions. You can still create new transactions."}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleRetryTransactions} variant="outline">
                Retry
              </Button>
              <Button
                onClick={() => {
                  setTransactionsUnavailable(false);
                  setTransactionsUnavailableMessage(null);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4 bg-white">
        {loading || loadingProducts ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                      {transactionsUnavailable
                        ? "Transactions are unavailable. You can still create transactions using the 'New' button."
                        : "No transactions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => {
                    // IMPORTANT: display product name if present, otherwise show product id as plain number
                    // (no leading '#'). If product_id is null/undefined, show "Unknown product"
                    const prod = t.product ?? productsMap.get(t.product_id);
                    const displayProductLabel =
                      prod?.name ?? (t.product_id != null ? String(t.product_id) : "Unknown product");

                    const isOut = t.transaction_type === "stock_out";
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{displayProductLabel}</span>
                            {prod?.sku && <span className="text-xs text-gray-500">{prod.sku}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOut ? "destructive" : "secondary"}>
                            {t.transaction_type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{t.quantity}</TableCell>
                        <TableCell className="text-right">
                          {t.unit_price != null ? `$${Number(t.unit_price).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {t.total_price != null ? `$${Number(t.total_price).toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>{t.reference_number ?? ""}</TableCell>
                        <TableCell>{t.notes ?? ""}</TableCell>
                        <TableCell>{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              <TableCaption>Showing {filtered.length} of {transactions.length} transactions</TableCaption>
            </Table>
          </>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>New Inventory Transaction</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          value={field.value ? String(field.value) : ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
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

                <FormField
                  control={form.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stock_in">Stock In</SelectItem>
                            <SelectItem value="stock_out">Stock Out</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                            <SelectItem value="return">Return</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
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

                <FormField
                  control={form.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}