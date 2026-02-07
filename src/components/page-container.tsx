import { cn } from "@/lib/utils";

export function PageContainer({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("mx-auto px-6 py-10", wide ? "max-w-5xl" : "max-w-4xl")}>
      {children}
    </div>
  );
}
