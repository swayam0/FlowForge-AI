import { Skeleton } from "../ui/Skeleton";
import { cn } from "../../lib/utils";

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-full rounded-md bg-white/10", className)} />
  );
}
