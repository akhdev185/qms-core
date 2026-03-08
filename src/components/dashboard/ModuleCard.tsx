import { LucideIcon, ArrowRight, FileText, FolderOpen, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  moduleClass: string;
  stats: { formsCount: number; recordsCount: number; pendingCount: number; issuesCount: number };
  isoClause: string;
  isLoading?: boolean;
}

const moduleColorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "module-sales":       { bg: "bg-[hsl(var(--module-sales)/0.08)]",       text: "text-[hsl(var(--module-sales))]",       border: "border-[hsl(var(--module-sales)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-sales)/0.25)]" },
  "module-operations":  { bg: "bg-[hsl(var(--module-operations)/0.08)]",  text: "text-[hsl(var(--module-operations))]",  border: "border-[hsl(var(--module-operations)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-operations)/0.25)]" },
  "module-quality":     { bg: "bg-[hsl(var(--module-quality)/0.08)]",     text: "text-[hsl(var(--module-quality))]",     border: "border-[hsl(var(--module-quality)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-quality)/0.25)]" },
  "module-procurement": { bg: "bg-[hsl(var(--module-procurement)/0.08)]", text: "text-[hsl(var(--module-procurement))]", border: "border-[hsl(var(--module-procurement)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-procurement)/0.25)]" },
  "module-hr":          { bg: "bg-[hsl(var(--module-hr)/0.08)]",          text: "text-[hsl(var(--module-hr))]",          border: "border-[hsl(var(--module-hr)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-hr)/0.25)]" },
  "module-rnd":         { bg: "bg-[hsl(var(--module-rnd)/0.08)]",         text: "text-[hsl(var(--module-rnd))]",         border: "border-[hsl(var(--module-rnd)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-rnd)/0.25)]" },
  "module-management":  { bg: "bg-[hsl(var(--module-management)/0.08)]",  text: "text-[hsl(var(--module-management))]",  border: "border-[hsl(var(--module-management)/0.15)]", glow: "group-hover:shadow-[0_8px_30px_-8px_hsl(var(--module-management)/0.25)]" },
};

const defaultColor = { bg: "bg-primary/8", text: "text-primary", border: "border-primary/15", glow: "" };

export function ModuleCard({ title, description, icon: Icon, moduleClass, stats, isoClause, isLoading = false }: ModuleCardProps) {
  const colors = moduleColorMap[moduleClass] || defaultColor;

  // Derive compliance from available data
  const total = stats.formsCount + stats.recordsCount;
  const issues = stats.pendingCount + stats.issuesCount;
  const complianceRate = total > 0 ? Math.round(((total - issues) / total) * 100) : 100;

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-card rounded-xl border border-border overflow-hidden group cursor-pointer transition-all duration-300",
      "hover:border-transparent hover:-translate-y-0.5",
      colors.glow
    )}>
      {/* Top accent line */}
      <div className={cn("h-1 w-full", colors.bg.replace("/0.08)", "/0.5)"))} />

      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
              colors.bg,
              "group-hover:scale-105"
            )}>
              <Icon className={cn("w-5 h-5 transition-colors", colors.text)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
              <span className={cn("text-[9px] font-semibold uppercase tracking-widest", colors.text, "opacity-70")}>{isoClause}</span>
            </div>
          </div>
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0",
            colors.bg
          )}>
            <ArrowRight className={cn("w-3.5 h-3.5", colors.text)} />
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-2">{description}</p>

        {/* Stats row */}
        <div className={cn("flex items-center gap-2 p-2.5 rounded-lg border", colors.bg, colors.border)}>
          <div className="flex items-center gap-1.5 flex-1">
            <FileText className={cn("w-3.5 h-3.5 shrink-0", colors.text, "opacity-60")} />
            <span className="text-xs font-bold text-foreground">{stats.formsCount}</span>
            <span className="text-[9px] text-muted-foreground">Forms</span>
          </div>
          <div className={cn("w-px h-4", colors.border)} />
          <div className="flex items-center gap-1.5 flex-1">
            <FolderOpen className={cn("w-3.5 h-3.5 shrink-0", colors.text, "opacity-60")} />
            <span className="text-xs font-bold text-foreground">{stats.recordsCount}</span>
            <span className="text-[9px] text-muted-foreground">Records</span>
          </div>
          {(stats.pendingCount > 0 || stats.issuesCount > 0) && (
            <>
              <div className={cn("w-px h-4", colors.border)} />
              <div className="flex items-center gap-1.5">
                {stats.pendingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-warning">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                    {stats.pendingCount}
                  </span>
                )}
                {stats.issuesCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-destructive">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    {stats.issuesCount}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Compliance bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Compliance
            </span>
            <span className={cn("text-[10px] font-bold", complianceRate >= 80 ? "text-success" : complianceRate >= 50 ? "text-warning" : "text-destructive")}>
              {complianceRate}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                complianceRate >= 80 ? "bg-success" : complianceRate >= 50 ? "bg-warning" : "bg-destructive"
              )}
              style={{ width: `${complianceRate}%` }}
            />
          </div>
        </div>

        {/* Activity hint */}
        {(stats.pendingCount > 0 || stats.issuesCount > 0) && (
          <div className="mt-3 flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>
              {stats.pendingCount > 0 && <span className="font-semibold text-warning">{stats.pendingCount} pending</span>}
              {stats.pendingCount > 0 && stats.issuesCount > 0 && " · "}
              {stats.issuesCount > 0 && <span className="font-semibold text-destructive">{stats.issuesCount} issues</span>}
              {" — action needed"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
