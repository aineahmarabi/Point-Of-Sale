"use client";

import { createContext, useContext, useCallback } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@repo/backend";
import {
  hasPermission as _hasPermission,
  hasAnyPermission as _hasAnyPermission,
} from "@repo/lib/utils";

type CurrentUser = FunctionReturnType<typeof api.user.users.currentUser>;

interface DataContextValue {
  currentUser: CurrentUser;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.user.users.currentUser);

  if (!user) {
    return null;
  }

  const permissions = user.role?.permissions ?? [];

  return (
    <DataContext.Provider
      value={{
        currentUser: user,
        permissions,
        hasPermission: (p) => _hasPermission(permissions, p),
        hasAnyPermission: (p) => _hasAnyPermission(permissions, p),
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }

  return context;
}
