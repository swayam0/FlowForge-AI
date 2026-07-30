import { Skeleton } from "../ui/Skeleton";
import { cn } from "../../lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/5 bg-[#0a0a0a] p-5 h-[180px] flex flex-col justify-between overflow-hidden", className)}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg bg-white/5" />
            <Skeleton className="h-5 w-32 bg-white/5" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
        </div>
        <div className="flex gap-4 mt-4 ml-11">
          <Skeleton className="h-3 w-8 bg-white/5" />
          <Skeleton className="h-3 w-16 bg-white/5" />
        </div>
      </div>
      <div className="flex justify-between items-end ml-11 mt-4">
        <Skeleton className="h-3 w-20 bg-white/5" />
        <Skeleton className="h-6 w-16 rounded-md bg-white/5" />
      </div>
    </div>
  );
}
