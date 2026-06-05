"use client";

import { useState, useCallback } from "react";
import { updateClerkUser, type UpdateUserParams } from "../actions/update-user";

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback(async (params: UpdateUserParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateClerkUser(params);
      return result;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateUser, loading, error, setError };
}
