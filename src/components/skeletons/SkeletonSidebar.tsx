import { Skeleton } from "../ui/Skeleton";
import { cn } from "../../lib/utils";

export function SkeletonSidebar({ className }: { className?: string }) {
  return (
    <div className={cn("w-64 border-r border-white/5 bg-[#050505] p-4 flex flex-col gap-6", className)}>
      <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 bg-white/5" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
