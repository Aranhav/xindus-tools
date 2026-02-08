"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Package,
  MapPin,
  FileSpreadsheet,
  ScanSearch,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/tracking", label: "Tracking", icon: Package },
  { href: "/address-validation", label: "Address Validation", icon: MapPin },
  { href: "/b2b-sheets", label: "B2B Sheets", icon: FileSpreadsheet },
  { href: "/hsn-classifier", label: "HSN Classifier", icon: ScanSearch },
  { href: "/b2b-agent", label: "B2B Agent", icon: Bot },
];

export function TopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-12 items-center gap-2.5 border-b border-border px-4">
              <Image
                src="/xindus-logo.png"
                alt="Xindus"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-serif text-base font-bold text-foreground">
                Xindus Tools
              </span>
            </div>
            <nav className="px-2 py-4">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tools
              </p>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          "text-muted-foreground hover:bg-accent hover:text-foreground",
                          isActive && "bg-accent text-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Brand — visible on mobile (sidebar hidden) */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <Image
            src="/xindus-logo.png"
            alt="Xindus"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-serif text-base font-bold text-foreground">
            Xindus Tools
          </span>
        </Link>
      </div>

      {/* Right */}
      <ThemeToggle />
    </header>
  );
}
