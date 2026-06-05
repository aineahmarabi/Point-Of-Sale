"use client";

import { useState, useCallback } from "react";
import { createClerkUser, type CreateUserParams } from "../actions/create-user";

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (params: CreateUserParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createClerkUser(params);
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

  return { signUp, loading, error, setError };
}
