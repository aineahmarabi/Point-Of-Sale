"use client";

import { SignUp } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";

function StoreLogo() {
  const settings = useQuery(api.settings.storeSettings.getPublic);
  if (!settings?.logo_url) return null;
  return (
    <div className="flex justify-center mb-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={settings.logo_url}
        alt="Store logo"
        className="h-16 w-16 object-contain rounded-full shadow-lg"
      />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "url('/bg-login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-md px-4">
        <StoreLogo />
        <SignUp
          appearance={{
            elements: {
              card: "bg-gradient-to-br from-white via-rose-50 to-amber-50 shadow-2xl border border-white/20",
              headerTitle: "text-slate-800 font-bold",
              headerSubtitle: "text-slate-500",
              formFieldInput:
                "bg-white/80 border-slate-200 focus:border-[#7B1C1C]",
              formButtonPrimary: "bg-[#7B1C1C] hover:bg-[#6a1818] text-white",
              socialButtonsBlockButton: "hidden",
              socialButtonsProviderIcon: "hidden",
              dividerRow: "hidden",
              dividerText: "hidden",
              footerAction: "hidden",
              footerActionLink: "hidden",
              footerActionText: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
