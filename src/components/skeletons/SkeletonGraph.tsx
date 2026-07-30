import { Skeleton } from "../ui/Skeleton";
import { cn } from "../../lib/utils";

export function SkeletonGraph({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full min-h-[400px] bg-[#050505] overflow-hidden flex items-center justify-center", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,_rgba(59,130,246,0.02)_0%,_rgba(0,0,0,0)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      
      <div className="relative flex items-center gap-16">
        <Skeleton className="w-[320px] h-32 rounded-xl bg-white/5 border border-white/5 shadow-2xl" />
        <Skeleton className="w-16 h-1 rounded-full bg-white/5" />
        <Skeleton className="w-[320px] h-32 rounded-xl bg-white/5 border border-white/5 shadow-2xl" />
      </div>
    </div>
  );
}
