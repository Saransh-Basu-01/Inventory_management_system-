import { useEffect, useState } from "react";
import { RefreshCw, Shield, UserCog, User as UserIcon, Plus, AlertCircle, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContent";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface User {
  id: number;
  username:  string;
  email: string;
  full_name: string | null;
  role: "admin" | "manager" | "staff";
}

// ═══════════════════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════════════════

const createUserSchema = z. object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<{
    userId: number;
    username: string;
    currentRole: string;
    newRole: string;
  } | null>(null);

  const { user:  currentUser } = useAuth();

  const form = useForm<CreateUserFormData>({
    resolver:  zodResolver(createUserSchema) as any,
    defaultValues: {
      username: "",
      email: "",
      password: "",
      full_name:  "",
      role:  "staff",
    },
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/auth/users");
      let data = res.data;
      if (data && data.items) data = data.items;
      if (data && data. data) data = data.data;
      
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err:  any) {
      console.error("Error fetching users:", err);
      setError(getErrorMessage(err));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper to extract error message
  const getErrorMessage = (err: any): string => {
    if (typeof err === "string") return err;
    if (err?. response?.data?. detail) {
      const detail = err.response.data.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail. map((d: any) => d.msg || d).join(", ");
      if (typeof detail === "object") return JSON.stringify(detail);
    }
    if (err?.response?. data?.message) return err.response.data.message;
    if (err?.message) return err.message;
    return "An unexpected error occurred";
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Initiate role change
  const initiateRoleChange = (user: User, newRole: string) => {
    if (user.role === newRole) return;
    
    setRoleChangeConfirm({
      userId:  user.id,
      username: user. username,
      currentRole: user.role,
      newRole:  newRole,
    });
  };

  // Confirm role change - FIXED API CALL
  const confirmRoleChange = async () => {
    if (!roleChangeConfirm) return;
    
    const { userId, newRole, username } = roleChangeConfirm;
    
    setChangingRole(userId);
    setError(null);
    setRoleChangeConfirm(null);
    
    try {
      // Use request body format (matches the backend we just created)
      const response = await api.patch(`/auth/users/${userId}/role`, { 
        role: newRole 
      });
      
      console.log("Role change response:", response. data);
      showSuccess(`Successfully changed ${username}'s role to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      console.error("Error changing role:", err);
      setError(getErrorMessage(err));
    } finally {
      setChangingRole(null);
    }
  };

  // Create new user
  const onCreateUser = async (data: CreateUserFormData) => {
    setError(null);
    try {
      await api.post("/auth/users", data);
      setIsCreateOpen(false);
      form.reset();
      showSuccess(`User "${data.username}" created successfully!`);
      fetchUsers();
    } catch (err:  any) {
      console.error("Error creating user:", err);
      setError(getErrorMessage(err));
    }
  };

  // Role helpers
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />;
      case "manager": return <UserCog className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role:  string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "manager": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  // Stats
  const adminCount = users.filter(u => u.role === "admin").length;
  const managerCount = users. filter(u => u.role === "manager").length;
  const staffCount = users.filter(u => u.role === "staff").length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-gray-500">Manage user roles and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
              <Shield className="h-4 w-4" /> Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{adminCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-1">
              <UserCog className="h-4 w-4" /> Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{managerCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <UserIcon className="h-4 w-4" /> Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{staffCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">{error}</div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-600 hover: text-red-800 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4 flex items-center gap-2">
          <Check className="h-5 w-5" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Table - Fixed overflow */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="min-w-[120px]">Username</TableHead>
                <TableHead className="min-w-[180px]">Email</TableHead>
                <TableHead className="min-w-[120px] hidden md:table-cell">Full Name</TableHead>
                <TableHead className="w-28">Role</TableHead>
                <TableHead className="w-36">Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading... 
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ?  (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user. id}>
                    <TableCell className="text-gray-500 text-sm">#{user.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[100px]">{user.username}</span>
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 truncate block max-w-[160px]">
                        {user.email}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm truncate block max-w-[100px]">
                        {user.full_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleBadgeColor(user.role)} text-white text-xs`}>
                        {user. role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.id === currentUser?.id ?  (
                        <span className="text-gray-400 text-xs">N/A</span>
                      ) : changingRole === user.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => initiateRoleChange(user, newRole)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* User count */}
      <div className="mt-4 text-sm text-gray-500">
        Total:  {users.length} user(s)
      </div>

      {/* Role Change Confirmation */}
      <AlertDialog open={!! roleChangeConfirm} onOpenChange={() => setRoleChangeConfirm(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role? </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to change role for: </p>
                <div className="bg-gray-50 p-3 rounded-md space-y-1">
                  <p><strong>User:</strong> {roleChangeConfirm?. username}</p>
                  <p className="flex items-center gap-2">
                    <strong>From:</strong> 
                    <Badge className={`${getRoleBadgeColor(roleChangeConfirm?. currentRole || "")} text-white`}>
                      {roleChangeConfirm?.currentRole}
                    </Badge>
                  </p>
                  <p className="flex items-center gap-2">
                    <strong>To: </strong>
                    <Badge className={`${getRoleBadgeColor(roleChangeConfirm?.newRole || "")} text-white`}>
                      {roleChangeConfirm?.newRole}
                    </Badge>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New User
            </DialogTitle>
          </DialogHeader>

          <Form {... form}>
            <form onSubmit={form.handleSubmit(onCreateUser)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form. control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-red-500" />
                            Admin - Full access
                          </div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-blue-500" />
                            Manager - Create & Edit
                          </div>
                        </SelectItem>
                        <SelectItem value="staff">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            Staff - View only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}