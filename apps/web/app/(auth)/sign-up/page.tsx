"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@repo/ui/components/ui/input-otp";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { useSignUpFlow } from "@repo/auth/hooks";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const storePublic = useQuery(api.settings.storeSettings.getPublic);
  const {
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
  } = useSignUpFlow();

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-50 px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {storePublic?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storePublic.logo_url}
            alt={storePublic.store_name ?? "Store logo"}
            className="mx-auto h-24 w-24 rounded-full object-cover"
          />
        ) : null}
        {step === "signUp" ? (
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">
                Create an account
              </CardTitle>
              <CardDescription>
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Sign up"}
                </Button>
                <p className="text-muted-foreground text-center text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">
                Verify your email
              </CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p className="text-destructive text-center text-sm">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length < 6}
                >
                  {loading ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={resetToSignUp}
                >
                  Back to sign up
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
