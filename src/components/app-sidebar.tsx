"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Package,
  MapPin,
  FileSpreadsheet,
  ScanSearch,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/tracking", label: "Tracking", icon: Package },
  { href: "/address-validation", label: "Address Validation", icon: MapPin },
  { href: "/b2b-sheets", label: "B2B Sheets", icon: FileSpreadsheet },
  { href: "/hsn-classifier", label: "HSN Classifier", icon: ScanSearch },
  { href: "/b2b-agent", label: "B2B Agent", icon: Bot },
];

const STORAGE_KEY = "sidebar-collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  return (
    <aside
      className={cn(
        "hidden flex-col border-r border-border bg-background md:flex",
        "transition-[width] duration-200 ease-in-out",
      )}
      style={{ width: mounted ? (collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)") : "var(--sidebar-width)" }}
    >
      {/* Header */}
      <div className="flex h-12 items-center gap-2.5 overflow-hidden border-b border-border px-4">
        <Image
          src="/xindus-logo.png"
          alt="Xindus"
          width={24}
          height={24}
          className="shrink-0 rounded"
        />
        {!collapsed && (
          <span className="truncate font-serif text-sm font-bold text-foreground">
            Xindus Tools
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tools
          </p>
        )}
        <TooltipProvider>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-foreground",
                    isActive && "bg-accent text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.href}>{linkContent}</li>;
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center px-0" : "justify-start gap-2")}
          onClick={toggle}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
