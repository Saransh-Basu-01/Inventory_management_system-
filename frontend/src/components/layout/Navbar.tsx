import { Link, NavLink, useNavigate } from "react-router-dom";
import { 
  Package, Users, BarChart3, ShoppingCart, FolderTree, 
  Menu, LogOut, Shield, UserCog, User as UserIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContent";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Role badge color
  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleConfig = {
      admin: { color: "bg-red-500", icon: Shield, label: "Admin" },
      manager:  { color: "bg-blue-500", icon:  UserCog, label:  "Manager" },
      staff: { color: "bg-gray-500", icon:  UserIcon, label: "Staff" },
    };
    
    const config = roleConfig[user.role];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const navLinks = [
    { to: "/", label: "Dashboard", icon: BarChart3 },
    { to:  "/products", label:  "Products", icon:  Package },
    { to: "/categories", label: "Categories", icon: FolderTree },
    { to: "/suppliers", label: "Suppliers", icon: Users },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/sales", label: "Sales", icon: ShoppingCart },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="hidden font-bold text-xl sm:inline-block">IMS</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:items-center md:space-x-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link. to}
                className={({ isActive }) =>
                  `flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-gray-600"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
          
          {/* Admin Only:  Users link */}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-gray-600"
                }`
              }
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </NavLink>
          )}
        </div>

        {/* Right side - User info */}
        {user && (
          <div className="ml-auto flex items-center space-x-4">
            {/* Role Badge */}
            {getRoleBadge()}
            
            {/* Username */}
            <span className="hidden text-sm text-gray-600 sm:inline">
              {user. full_name || user. username}
            </span>
            
            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        )}

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden ml-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            {/* User info in mobile */}
            {user && (
              <div className="border-b pb-4 mb-4">
                <div className="font-medium">{user.full_name || user.username}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="mt-2">{getRoleBadge()}</div>
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const Icon = link. icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                        isActive ? "bg-primary/10 text-primary" :  "text-gray-700"
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
              
              {/* Admin Only: Users */}
              {isAdmin && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                      isActive ? "bg-primary/10 text-primary" : "text-gray-700"
                    }`
                  }
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </NavLink>
              )}
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}