"use client";

import { useQuery } from "convex/react";
import { SignIn } from "@clerk/nextjs";
import { api } from "@repo/backend";

function StoreLogo() {
  const storePublic = useQuery(api.settings.storeSettings.getPublic);
  if (!storePublic?.logo_url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={storePublic.logo_url}
      alt={storePublic.store_name ?? "Store logo"}
      className="h-24 w-24 rounded-full object-cover"
      style={{ filter: "drop-shadow(0 2px 12px rgba(255,255,255,0.6))" }}
    />
  );
}

export default function SignInPage() {
  return (
    <div
      className="relative h-full w-full flex flex-col items-center justify-center"
      style={{
        backgroundImage: "url('/bg-login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <StoreLogo />
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#7B1C1C",
            },
            elements: {
              card: "bg-gradient-to-br from-white via-rose-50 to-amber-50 shadow-2xl border border-white/20 rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}
