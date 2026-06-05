"use client";

import { usePathname, forbidden } from "next/navigation";
import { hasPermission } from "@repo/lib/utils";
import { useData } from "../providers/data-provider";

interface NavLink {
  url: string;
  permission?: string;
}

interface NavGroup {
  links: NavLink[];
}

export function usePermissionGuard(navigation: NavGroup[]): void {
  const pathname = usePathname();
  const { permissions } = useData();

  const matchedLink = navigation
    .flatMap((g) => g.links)
    .find((l) => pathname === l.url || pathname.startsWith(l.url + "/"));

  if (
    matchedLink?.permission &&
    !hasPermission(permissions, matchedLink.permission)
  ) {
    forbidden();
  }
}
