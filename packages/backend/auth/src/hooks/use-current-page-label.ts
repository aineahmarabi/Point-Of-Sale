"use client";

import { usePathname } from "next/navigation";

interface NavLink {
  title: string;
  url: string;
}

interface NavGroup {
  links: NavLink[];
}

export function useCurrentPageLabel(navigation: NavGroup[]): string {
  const pathname = usePathname();

  for (const group of navigation) {
    for (const link of group.links) {
      if (pathname === link.url || pathname.startsWith(link.url + "/")) {
        return link.title;
      }
    }
  }
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment
    ? segment.charAt(0).toUpperCase() + segment.slice(1)
    : "Dashboard";
}
