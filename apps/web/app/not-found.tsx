import Link from "next/link";
import { Button } from "@repo/ui/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
        404 Error
      </p>
      <h1 className="text-foreground text-5xl font-bold tracking-tight sm:text-6xl">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md text-base">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
        moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </main>
  );
}
