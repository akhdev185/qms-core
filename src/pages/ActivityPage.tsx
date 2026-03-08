import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useQMSData, useRecentActivity } from "@/hooks/useQMSData";
import { QMSRecord, formatTimeAgo, getModuleForCategory } from "@/lib/googleSheets";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, CheckCircle, AlertTriangle, Clock, User, ExternalLink,
  ArrowLeft, Activity, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getActivityType(record: QMSRecord): "created" | "approved" | "pending" | "issue" {
  const reviews = record.fileReviews || {};
  const reviewValues = Object.values(reviews) as Array<{ status?: string }>;
  const statuses = reviewValues.map(r => (r?.status || "").toLowerCase());
  const hasApproved = statuses.some(s => s === "approved" || s === "✅" || s.includes("approved"));
  const hasRejected = statuses.some(s => s === "rejected" || s.includes("invalid") || s === "❌" || s.includes("nc"));
  const hasPending = reviewValues.length === 0 ? false : statuses.some(s => s === "" || s === "pending" || s === "pending_review" || s.includes("under"));
  const auditStatus = (record.auditStatus || "").toLowerCase();
  if (auditStatus.includes("nc") || auditStatus.includes("issue") || hasRejected) return "issue";
  const hasRecords = (record.actualRecordCount || 0) > 0 || (record.lastSerial && record.lastSerial !== "No Files Yet");
  if (hasRecords && (hasPending || !hasApproved)) return "pending";
  if (record.reviewed || hasApproved) return "approved";
  return "created";
}

const typeConfig = {
  created: { icon: FileText, color: "text-info", bg: "bg-info/10", label: "New" },
  approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Approved" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  issue: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Issue" },
};

type FilterType = "all" | "created" | "approved" | "pending" | "issue";

export default function ActivityPage() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState("activity");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const handleToggle = (event: Event) => {
      setSidebarCollapsed((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener('qms-sidebar-toggle', handleToggle as EventListener);
    return () => window.removeEventListener('qms-sidebar-toggle', handleToggle as EventListener);
  }, []);

  const { data: records, isLoading } = useQMSData();
  const allActivity = useRecentActivity(records, 100);

  const filteredActivity = filter === "all"
    ? allActivity
    : allActivity.filter(r => getActivityType(r) === filter);

  const counts = {
    all: allActivity.length,
    created: allActivity.filter(r => getActivityType(r) === "created").length,
    approved: allActivity.filter(r => getActivityType(r) === "approved").length,
    pending: allActivity.filter(r => getActivityType(r) === "pending").length,
    issue: allActivity.filter(r => getActivityType(r) === "issue").length,
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ml-0",
        sidebarCollapsed ? "md:ml-[60px]" : "md:ml-60"
      )}>
        <Header />

        <main className="flex-1 overflow-auto">
          <div className="max-w-[1000px] mx-auto p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Recent Activity</h1>
                  <p className="text-xs text-muted-foreground">All record changes and updates across modules</p>
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "approved", "pending", "issue", "created"] as FilterType[]).map(f => {
                const config = f === "all" ? null : typeConfig[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                      filter === f
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50"
                    )}
                  >
                    {f === "all" ? "All" : config?.label}
                    <span className="ml-1.5 text-[10px] opacity-70">{counts[f]}</span>
                  </button>
                );
              })}
            </div>

            {/* Activity list */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {isLoading ? (
                <div className="divide-y divide-border">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="p-4 flex gap-3">
                      <Skeleton className="w-9 h-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivity.length === 0 ? (
                <div className="p-12 text-center">
                  <Filter className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No activity found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">No matching records for this filter</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredActivity.map((record, i) => {
                    const type = getActivityType(record);
                    const config = typeConfig[type];
                    const Icon = config.icon;
                    const module = getModuleForCategory(record.category);

                    return (
                      <div
                        key={`${record.code}-${i}`}
                        className="px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/record/${record.code}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">{record.recordName}</span>
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", config.bg, config.color)}>{config.label}</span>
                              {module && (
                                <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded capitalize">{module}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                              <span className="font-mono text-[10px]">{record.code}</span>
                              <span>·</span>
                              <span>{formatTimeAgo(record.lastFileDate)}</span>
                              {record.reviewedBy && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{record.reviewedBy}</span>
                                </>
                              )}
                              {record.actualRecordCount !== undefined && (
                                <>
                                  <span>·</span>
                                  <span>{record.actualRecordCount} files</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {record.folderLink && (
                              <a href={record.folderLink} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="text-muted-foreground/50 hover:text-primary p-1">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
