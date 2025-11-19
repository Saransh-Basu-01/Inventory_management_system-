import { Link, NavLink } from "react-router-dom";
import { Package, Users, BarChart3, ShoppingCart, FolderTree, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const navLinks = [
    { to: "/", label: "Dashboard", icon: BarChart3 },
    { to: "/products", label: "Products", icon: Package },
    { to: "/categories", label: "Categories", icon: FolderTree },
    { to: "/suppliers", label: "Suppliers", icon: Users },
    { to: "/inventory", label: "Inventory", icon: Package },
    { to: "/sales", label: "Sales", icon: ShoppingCart },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo / Brand */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="hidden font-bold text-xl sm:inline-block">
            IMS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:items-center md:space-x-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
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
        </div>

        {/* Right side actions (optional: user menu, notifications) */}
        <div className="ml-auto flex items-center space-x-4">
          <span className="hidden text-sm text-gray-600 sm:inline">
            Welcome, Saransh
          </span>
        </div>

        {/* Mobile menu trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col space-y-4 mt-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                        isActive ? "bg-primary/10 text-primary" : "text-gray-700"
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}