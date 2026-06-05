/**
 * Role / access helpers for the POS terminal.
 *
 * The terminal does NOT gate on a specific role name — any active staff member
 * with a role assigned may use it (see `isActiveStaff`). These helpers treat
 * "admin" generously: "Super Admin", "Admin", "admin", or any role carrying the
 * "*" wildcard permission all count as admin.
 */

export interface RoleLike {
  name?: string | null;
  permissions?: string[] | null;
}

export interface StaffLike {
  status?: string | null;
  role?: RoleLike | null;
}

/** Whether a permission set grants unrestricted access. */
export function hasWildcard(permissions?: string[] | null): boolean {
  return Array.isArray(permissions) && permissions.includes("*");
}

/**
 * Admin if the role name contains "admin" (covers "Super Admin", "Admin",
 * "admin") OR the role carries the "*" wildcard permission.
 */
export function isAdminRole(role?: RoleLike | null): boolean {
  if (!role) return false;
  if (hasWildcard(role.permissions)) return true;
  return (role.name ?? "").toLowerCase().includes("admin");
}

/** Cashier if the role name is exactly "cashier" (case-insensitive). */
export function isCashierRole(role?: RoleLike | null): boolean {
  return (role?.name ?? "").trim().toLowerCase() === "cashier";
}

/**
 * Terminal access gate: an **active** staff member with **any** role assigned.
 * Intentionally role-name agnostic — never blocks on a specific role name.
 */
export function isActiveStaff(user?: StaffLike | null): boolean {
  return !!user && user.status === "active" && !!user.role;
}
