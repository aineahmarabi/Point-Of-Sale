"use client";

import { useState, useCallback } from "react";
import { inviteClerkUser, type InviteUserParams } from "../actions/invite-user";

export function useInvite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = useCallback(async (params: InviteUserParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await inviteClerkUser(params);
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

  return { invite, loading, error, setError };
}
