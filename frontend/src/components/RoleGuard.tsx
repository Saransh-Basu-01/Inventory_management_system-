import { useAuth } from "@/context/AuthContent";
import { ReactNode } from "react";
type UserRole = "admin" | "manager" | "staff";
interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];  // Show only for these roles
  requireAdmin?: boolean;      // Shortcut:  only admin
  requireManager?: boolean;    // Shortcut: admin or manager
  fallback?: ReactNode;        // What to show if not allowed (default: nothing)
}

/**
 * Hide elements based on user role
 * 
 * Usage:
 * 
 * // Only admin can see
 * <RoleGuard requireAdmin>
 *   <DeleteButton />
 * </RoleGuard>
 * 
 * // Admin or Manager can see
 * <RoleGuard requireManager>
 *   <EditButton />
 * </RoleGuard>
 * 
 * // Specific roles
 * <RoleGuard allowedRoles={["admin", "manager"]}>
 *   <CreateButton />
 * </RoleGuard>
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  requireAdmin, 
  requireManager,
  fallback = null 
}: RoleGuardProps) {
  const { user, isAdmin, isManager } = useAuth();

  // Not logged in
  if (!user) return <>{fallback}</>;

  // Admin only
  if (requireAdmin && !isAdmin) return <>{fallback}</>;

  // Manager or Admin
  if (requireManager && !isAdmin && !isManager) return <>{fallback}</>;

  // Specific roles
  if (allowedRoles && ! allowedRoles. includes(user.role)) return <>{fallback}</>;

  // Allowed! 
  return <>{children}</>;
}

/**
 * Simpler components for common cases
 */
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?:  ReactNode }) {
  return <RoleGuard requireAdmin fallback={fallback}>{children}</RoleGuard>;
}

export function ManagerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard requireManager fallback={fallback}>{children}</RoleGuard>;
}

export default RoleGuard;