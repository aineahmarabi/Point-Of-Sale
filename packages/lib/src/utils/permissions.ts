export function hasPermission(
  permissions: string[],
  required: string,
): boolean {
  return permissions.includes("*") || permissions.includes(required);
}

export function hasAnyPermission(
  permissions: string[],
  required: string[],
): boolean {
  return (
    permissions.includes("*") || required.some((p) => permissions.includes(p))
  );
}

export function hasAllPermissions(
  permissions: string[],
  required: string[],
): boolean {
  return (
    permissions.includes("*") || required.every((p) => permissions.includes(p))
  );
}
