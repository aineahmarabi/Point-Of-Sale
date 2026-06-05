"use client";

import { useState, useCallback } from "react";
import { useSignUp } from "@clerk/nextjs";

type Step = "signUp" | "verify";

export function useSignUpFlow() {
  const { signUp, isLoaded, setActive } = useSignUp();

  const [step, setStep] = useState<Step>("signUp");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        await signUp.create({
          firstName,
          lastName,
          emailAddress: email,
          password,
        });

        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });

        setStep("verify");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, signUp, firstName, lastName, email, password],
  );

  const handleVerify = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isLoaded) return;

      setLoading(true);
      setError(null);

      try {
        const result = await signUp.attemptEmailAddressVerification({
          code: otp,
        });

        if (result.status === "complete") {
          await setActive({ session: result.createdSessionId });
        } else {
          setError("Verification could not be completed. Please try again.");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, signUp, otp, setActive],
  );

  const resetToSignUp = useCallback(() => {
    setStep("signUp");
    setOtp("");
    setError(null);
  }, []);

  return {
    step,
    firstName,
    setFirstName,
    lastName,
    setLastName,
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
    resetToSignUp,
  };
}
