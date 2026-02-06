import { CheckCircle, Clock, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ModuleStats } from "@/lib/googleSheets";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditReadinessProps {
  moduleStats: ModuleStats[];
  complianceRate: number;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const statusConfig = {
  compliant: {
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success",
    label: "Compliant"
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning",
    label: "In Progress"
  },
  attention: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive",
    label: "Needs Attention"
  },
};

function getModuleStatus(stats: ModuleStats): "compliant" | "pending" | "attention" {
  if (stats.issuesCount > 0) return "attention";
  if (stats.pendingCount > 0) return "pending";
  return "compliant";
}

function getModuleProgress(stats: ModuleStats): number {
  if (stats.formsCount === 0) return 0;
  if (stats.recordsCount === 0) return 0;

  // Calculate progress based on forms that have at least one record (basic readiness)
  // Or stick to the quality metric: (All Forms - Issues - Pending) / All Forms
  // But strictly gated by recordsCount > 0
  const compliantCount = Math.max(0, stats.formsCount - stats.issuesCount - stats.pendingCount);
  return Math.round((compliantCount / stats.formsCount) * 100);
}

export function AuditReadiness({
  moduleStats,
  complianceRate,
  isLoading = false,
  onRefresh,
}: AuditReadinessProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-16" />
          </div>
        </div>
        <div className="p-5 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate overall progress safely
  const validModules = moduleStats.filter(m => m.formsCount > 0);
  const displayCompliance = validModules.length > 0 ? complianceRate : 0;

  return (
    <div className="glass-card rounded-lg">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Audit Readiness Scope</h3>
            <p className="text-sm text-muted-foreground">{validModules.length} active modules</p>
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-2xl font-bold text-foreground">{displayCompliance}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {moduleStats.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No module data available
          </div>
        ) : (
          moduleStats.map((module) => {
            const hasData = module.formsCount > 0;
            const status = getModuleStatus(module);
            const config = statusConfig[status];
            const Icon = config.icon;
            const progress = getModuleProgress(module);

            return (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                      {module.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({module.recordsCount} records)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasData ? (
                      <>
                        <Icon className={cn("w-4 h-4", config.color)} />
                        <span className="text-sm font-medium text-foreground">{progress}%</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No Data</span>
                    )}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                {(module.issuesCount > 0 || module.pendingCount > 0) && (
                  <div className="flex items-center gap-3 text-xs">
                    {module.pendingCount > 0 && (
                      <span className="text-warning">{module.pendingCount} pending</span>
                    )}
                    {module.issuesCount > 0 && (
                      <span className="text-destructive">{module.issuesCount} issues</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
