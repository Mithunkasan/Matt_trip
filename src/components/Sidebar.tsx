"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Activity,
  LogOut,
  X,
  Menu,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teams", label: "My Teams", icon: Users },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/activity", label: "Activity", icon: Activity },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)" }}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--primary)" }}>
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight" style={{ color: "var(--sidebar-foreground)" }}>SplitWise</p>
            <p className="text-xs font-medium" style={{ color: "var(--sidebar-foreground)", opacity: 0.6 }}>Pro Edition</p>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" style={{ color: "var(--sidebar-foreground)" }} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-5 px-3">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "var(--sidebar-foreground)", opacity: 0.45 }}>
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "shadow-sm"
                      : "hover:bg-white/10"
                  )}
                  style={isActive
                    ? { background: "var(--primary)", color: "white" }
                    : { color: "var(--sidebar-foreground)", opacity: 0.85 }
                  }
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* WhatsApp Invite shortcut */}
        <div className="mt-6 mx-1">
          <p className="text-xs font-semibold uppercase tracking-widest px-2 mb-3" style={{ color: "var(--sidebar-foreground)", opacity: 0.45 }}>
            Quick Actions
          </p>
          <Link
            href="/teams?invite=1"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-white/10"
            style={{ color: "var(--sidebar-foreground)", opacity: 0.85 }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
              <MessageCircle className="h-3.5 w-3.5 text-green-400" />
            </div>
            Invite via WhatsApp
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t p-4" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--primary)", color: "white" }}
          >
            {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--sidebar-foreground)" }}>
              {session?.user?.name ?? "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--sidebar-foreground)", opacity: 0.55 }}>
              {session?.user?.email ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:bg-white/10"
          style={{ color: "var(--sidebar-foreground)", opacity: 0.75 }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={onMobileClose} />
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-9 w-9 rounded-lg border transition-colors hover:bg-muted md:hidden"
      style={{ borderColor: "var(--border)" }}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
