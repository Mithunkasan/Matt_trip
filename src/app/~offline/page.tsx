"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center px-4">
      <div className="mb-8 rounded-full bg-muted p-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">You are offline</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        It looks like you've lost your internet connection. We couldn't load this page from the cache. Please check your network and try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="default">
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
    </div>
  );
}
