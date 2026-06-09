"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, Home, Users, CreditCard, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          <Link href="/dashboard" className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <span className="text-lg">SplitWise Pro</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <ul className="grid gap-1 px-2">
            <li>
              <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm font-medium">
                <Home className="h-4 w-4" /> Dashboard
              </Link>
            </li>
            <li>
              <Link href="/teams" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm font-medium">
                <Users className="h-4 w-4" /> My Teams
              </Link>
            </li>
            <li>
              <Link href="/activity" className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted text-sm font-medium">
                <Bell className="h-4 w-4" /> Activity
              </Link>
            </li>
          </ul>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-lg">SplitWise Pro</span>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
