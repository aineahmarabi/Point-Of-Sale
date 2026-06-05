"use client";

import { useState, useCallback } from "react";
import { useSignIn } from "@clerk/nextjs";

type Step = "signIn" | "verify";

/**
 * Convert any thrown auth error into a safe, user-friendly message. Network
 * failures (offline / blocked) surface as a TypeError "Failed to fetch"; Clerk's
 * own errors already carry user-safe messages. Nothing internal is exposed.
 */
function toFriendlyAuthError(err: unknown): string {
  if (
    err instanceof TypeError ||
    (err instanceof Error &&
      /failed to fetch|network|load failed/i.test(err.message))
  ) {
    return "Unable to reach the server. Check your internet connection and try again.";
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

export function useSignInFlow() {
  const { signIn, isLoaded, setActive } = useSignIn();

  const [step, setStep] = useState<Step>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLoaded) return;

      setLoading(true);
      setError(null);

      try {
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
        } else if (result.status === "needs_second_factor") {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
          setStep("verify");
        } else {
          setError("Sign-in could not be completed. Please try again.");
        }
      } catch (err: unknown) {
        setError(toFriendlyAuthError(err));
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, signIn, email, password, setActive],
  );

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLoaded) return;

      setLoading(true);
      setError(null);

      try {
        const result = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: otp,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
        } else {
          setError("Verification could not be completed. Please try again.");
        }
      } catch (err: unknown) {
        setError(toFriendlyAuthError(err));
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, signIn, otp, setActive],
  );

  const resetToSignIn = useCallback(() => {
    setStep("signIn");
    setOtp("");
    setError(null);
  }, []);

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    otp,
    setOtp,
    error,
    loading,
    handleSubmit,
    handleVerify,
    resetToSignIn,
  };
}
