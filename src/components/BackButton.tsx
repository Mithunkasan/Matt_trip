"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Pages where the back button should be hidden (root-level pages with nowhere meaningful to go back to)
const HIDE_ON = ["/dashboard"];

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Hide on the main dashboard page
  if (HIDE_ON.includes(pathname)) return null;

  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back to previous page"
      className="group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:shadow-sm no-print"
      style={{
        borderColor: "var(--primary)",
        color: "var(--primary)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--primary)";
        (e.currentTarget as HTMLButtonElement).style.color = "white";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
      }}
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      Back
    </button>
  );
}
