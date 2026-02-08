import { cn } from "@/lib/utils";

export function PageContainer({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-6 py-8", wide ? "max-w-6xl" : "max-w-5xl")}>
      {children}
    </div>
  );
}
