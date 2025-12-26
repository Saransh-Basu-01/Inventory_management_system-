import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FolderTree,
  DollarSign,
  Activity,
  Box,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import {
  dashboardApi,
  type ProductSummary,
  type SaleSummary,
  type TransactionSummary,
  type CategorySummary,
} from "@/api/dashboard";

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

function StatCard({ title, value, description, icon, trend, trendValue, className }:  StatCardProps) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trendValue) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            {trendValue && (
              <span className={trend === "up" ?  "text-green-500" : trend === "down" ?  "text-red-500" : ""}>
                {trendValue}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Loading Skeleton for Stats
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [productsData, salesData, transactionsData, categoriesData, suppliersData] =
        await Promise. all([
          dashboardApi.getProducts(),
          dashboardApi.getSales().catch(() => []),
          dashboardApi. getTransactions().catch(() => []),
          dashboardApi. getCategories(),
          dashboardApi. getSuppliers(),
        ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setSuppliersCount(Array.isArray(suppliersData) ? suppliersData. length : 0);
    } catch (error) {
      console. error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Computed statistics
  const stats = useMemo(() => {
    const lowStockProducts = products.filter(
      (p) => p.quantity <= (p.reorder_level || 10)
    );
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalInventoryValue = products. reduce(
      (sum, p) => sum + p.price * p. quantity,
      0
    );

    return {
      totalProducts: products.length,
      lowStockCount: lowStockProducts.length,
      totalCategories: categories.length,
      totalSuppliers: suppliersCount,
      totalSales: sales.length,
      totalRevenue,
      totalInventoryValue,
      recentTransactions: transactions.length,
      lowStockProducts,
    };
  }, [products, sales, transactions, categories, suppliersCount]);

  // Recent sales (last 5)
  const recentSales = useMemo(() => {
    return [... sales]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [sales]);

  // Recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [... transactions]
      . sort((a, b) => {
        const dateA = a.created_at ?  new Date(a. created_at).getTime() : 0;
        const dateB = b. created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [transactions]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    products.forEach((p) => {
      const catName = p.category?. name || "Uncategorized";
      distribution[catName] = (distribution[catName] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, count]) => ({ name, count, percentage: (count / products.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [products]);

  // Top products by value
  const topProducts = useMemo(() => {
    return [... products]
      . map((p) => ({ ... p, totalValue: p.price * p.quantity }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style:  "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "stock_in": 
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Stock In</Badge>;
      case "stock_out":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Stock Out</Badge>;
      case "adjustment":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Adjustment</Badge>;
      case "return":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Return</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[... Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[... Array(4)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back!  Here's an overview of your inventory. 
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ?  "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md: grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          description="in inventory"
          icon={<Package className="h-4 w-4" />}
        />
        <StatCard
          title="Low Stock Alerts"
          value={stats.lowStockCount}
          description="products need reorder"
          icon={<AlertTriangle className="h-4 w-4" />}
          className={stats.lowStockCount > 0 ?  "border-orange-200 bg-orange-50/50" : ""}
        />
        <StatCard
          title="Total Sales"
          value={stats. totalSales}
          description="transactions"
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description="from all sales"
          icon={<DollarSign className="h-4 w-4" />}
          trend="up"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.totalInventoryValue)}
          description="total stock value"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          description="product categories"
          icon={<FolderTree className="h-4 w-4" />}
        />
        <StatCard
          title="Suppliers"
          value={stats.totalSuppliers}
          description="active suppliers"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Transactions"
          value={stats.recentTransactions}
          description="inventory movements"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Products that need reordering</CardDescription>
            </div>
            <Link to="/products">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Box className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">All products are well stocked! </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product. name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product. sku}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.quantity} left</p>
                        <p className="text-xs text-muted-foreground">
                          Min:  {product.reorder_level || 10}
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        Low
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-primary" />
                Category Distribution
              </CardTitle>
              <CardDescription>Products by category</CardDescription>
            </div>
            <Link to="/categories">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderTree className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No categories found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {categoryDistribution. map((cat) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {cat.count} products ({cat.percentage. toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={cat.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="lg: col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Recent Sales
              </CardTitle>
              <CardDescription>Latest sales transactions</CardDescription>
            </div>
            <Link to="/sales">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No sales yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales. map((sale) => (
                    <TableRow key={sale. id}>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{sale.customer_name || "Walk-in"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale. total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Latest inventory movements</CardDescription>
            </div>
            <Link to="/inventory">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions. map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.product?. name || `Product #${tx.product_id}`}
                      </TableCell>
                      <TableCell>{getTransactionBadge(tx.transaction_type)}</TableCell>
                      <TableCell className="text-right font-medium">{tx. quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products by Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Products by Value
            </CardTitle>
            <CardDescription>Highest value inventory items</CardDescription>
          </div>
          <Link to="/products">
            <Button variant="ghost" size="sm">
              View All Products
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category?.name || "Uncategorized"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product. totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/products">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link to="/inventory">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Activity className="h-6 w-6" />
                <span>Record Transaction</span>
              </Button>
            </Link>
            <Link to="/sales">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span>New Sale</span>
              </Button>
            </Link>
            <Link to="/suppliers">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>View Suppliers</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}