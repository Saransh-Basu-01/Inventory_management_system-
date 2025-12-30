import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, Truck, Mail, Phone, MapPin, User } from "lucide-react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContent";
import { AdminOnly, ManagerOnly } from "@/components/RoleGuard";



interface Supplier {
  id: number;
  name:  string;
  contact_person?:  string | null;
  email?:  string | null;
  phone?: string | null;
  address?: string | null;
}


const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (! val || val === "") return true; // Allow empty
        
        // Remove spaces, dashes, parentheses
        const cleaned = val.replace(/[\s\-\(\)\. ]/g, "")
                           .replace(/^\+977/, "")
                           .replace(/^977/, "");
        
        // Must be exactly 10 digits
        if (!/^\d{10}$/.test(cleaned)) return false;
        
        // Must start with 98 or 97
        if (! cleaned.startsWith("98") && !cleaned.startsWith("97")) return false;
        
        return true;
      },
      { message: "Enter valid Nepali number (10 digits starting with 98 or 97)" }
    ),
  address: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Auth
  const { canCreate, canEdit, canDelete, isStaff } = useAuth();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: { name: "", contact_person: "", email:  "", phone: "", address: "" },
  });

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = () => {
    setEditingSupplier(null);
    form.reset({ name: "", contact_person: "", email:  "", phone: "", address: "" });
    setIsFormOpen(true);
  };

  const handleEdit = (supplier:  Supplier) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier. phone || "",
      address: supplier.address || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (! deleteId) return;
    try {
      await api.delete(`/suppliers/${deleteId}`);
      fetchSuppliers();
      setDeleteId(null);
    } catch (error:  any) {
      alert(error.response?.data?.detail || "Failed to delete supplier");
    }
  };

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier.id}`, data);
      } else {
        await api.post("/suppliers", data);
      }
      setIsFormOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      alert(error.response?. data?.detail || "Failed to save supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?. toLowerCase().includes(searchTerm.toLowerCase()) ||
    s. email?.toLowerCase().includes(searchTerm. toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Suppliers
          </h1>
          <p className="text-gray-500">
            Manage your suppliers
            {isStaff && <Badge variant="outline" className="ml-2">View Only</Badge>}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSuppliers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <ManagerOnly>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </ManagerOnly>
        </div>
      </div>

      {/* Staff notice */}
      {isStaff && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md mb-4">
          👁️ You have <strong>view-only</strong> access.  Contact an admin or manager to make changes.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">With Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers. filter(s => s.email).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">With Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s.phone).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredSuppliers. length === 0 ?  (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers. map((supplier) => (
                <TableRow key={supplier. id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      {supplier.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.contact_person ?  (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        {supplier.contact_person}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {supplier.email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {supplier.email}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {supplier.phone ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {supplier.phone}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {supplier.address ?  (
                      <div className="flex items-center gap-1 max-w-xs truncate">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {supplier.address}
                      </div>
                    ) : "-"}
                  </TableCell>

                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex gap-2">
                        <ManagerOnly>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </ManagerOnly>

                        <AdminOnly>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => setDeleteId(supplier. id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AdminOnly>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {editingSupplier ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>

          <Form {... form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name *</FormLabel>
                    <FormControl><Input placeholder="Enter supplier name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form. control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input placeholder="Contact person name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Full address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit">{editingSupplier ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!! deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier? </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier. 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}