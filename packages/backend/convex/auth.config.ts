export default {
  providers: [
    {
      // Clerk JWT issuer URL — set CLERK_ISSUER_URL in packages/database/.env.local
      // Found in Clerk Dashboard → API Keys → JWT issuer
      // Format: https://<your-clerk-domain>.clerk.accounts.dev
      domain: process.env.CLERK_ISSUER_URL!,
      applicationID: "convex",
    },
  ],
};
