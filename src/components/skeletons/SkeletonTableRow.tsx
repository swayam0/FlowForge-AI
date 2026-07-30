import { Skeleton } from "../ui/Skeleton";
import { cn } from "../../lib/utils";

export function SkeletonTableRow({ columns = 5, className }: { columns?: number, className?: string }) {
  return (
    <tr className={cn("border-b border-white/5 bg-[#0a0a0a]/50", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className={cn("h-4 bg-white/5", i === 0 ? "w-32" : i === columns - 1 ? "w-16" : "w-24")} />
        </td>
      ))}
    </tr>
  );
}
