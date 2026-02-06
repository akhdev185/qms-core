import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AuditReadiness } from "@/components/dashboard/AuditReadiness";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  useQMSData,
  useModuleStats,
  useAuditSummary,
  useReviewSummary,
  useMonthlyComparison,
  useRecentActivity,
} from "@/hooks/useQMSData";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Settings,
  ClipboardCheck,
  ShoppingCart,
  GraduationCap,
  Lightbulb,
  Building2,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const moduleIcons: Record<string, LucideIcon> = {
  sales: Users,
  operations: Settings,
  quality: ClipboardCheck,
  procurement: ShoppingCart,
  hr: GraduationCap,
  rnd: Lightbulb,
  management: Building2,
};

const moduleDescriptions: Record<string, { description: string; isoClause: string }> = {
  sales: {
    description: "Manage customer lifecycle from requirements capture to post-delivery feedback and satisfaction tracking.",
    isoClause: "Clause 8.2, 9.1.2",
  },
  operations: {
    description: "Plan, control, and execute operational activities with project timelines and resource scheduling.",
    isoClause: "Clause 8.1, 8.5",
  },
  quality: {
    description: "Core module for quality control, nonconformity handling, internal audits, and corrective actions.",
    isoClause: "Clause 9, 10",
  },
  procurement: {
    description: "Ensure all purchased items and vendors meet quality requirements with approval workflows.",
    isoClause: "Clause 8.4",
  },
  hr: {
    description: "Track personnel competence, training records, and performance appraisals.",
    isoClause: "Clause 7.2, 7.3",
  },
  rnd: {
    description: "Manage innovation, development requests, and technical validation processes.",
    isoClause: "Clause 8.3",
  },
  management: {
    description: "Control governance, documentation, KPI tracking, and leadership decisions.",
    isoClause: "Clause 5, 6, 7.5",
  },
};

import { PendingActions } from "@/components/dashboard/PendingActions";

export default function Index() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch live data from Google Sheets
  const { data: records, isLoading, isError, refetch, dataUpdatedAt } = useQMSData();

  // Derived data
  const moduleStats = useModuleStats(records);
  const auditSummary = useAuditSummary(records);
  const reviewSummary = useReviewSummary(records);
  const monthlyComparison = useMonthlyComparison(records);
  const activity = useRecentActivity(records);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["qms-data"] });
    refetch();
  };

  if (isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to load QMS Data</h2>
          <p className="text-muted-foreground mb-4">Could not connect to Google Sheets data source.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const complianceRate = auditSummary?.complianceRate || 0;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <div className="flex-1 flex flex-col md:ml-64 ml-0">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">QMS Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Overview of ISO 9001:2015 compliance and metrics.
                {lastUpdated && (
                  <span className="ml-2 text-sm">
                    • Last synced: {lastUpdated}
                  </span>
                )}
              </p>
            </div>

           

          {/* Status Cards - Live Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            <div onClick={() => navigate("/audit")} className="cursor-pointer">
              <StatusCard
                title="Form Templates"
                value={auditSummary.total}
                subtitle="35 total forms available"
                icon={FileText}
                isLoading={isLoading}
              />
            </div>
            <div onClick={() => navigate("/audit?tab=pending")} className="cursor-pointer">
              <StatusCard
                title="Filled Records"
                value={records?.reduce((sum, r) => sum + (r.actualRecordCount || 0), 0) || 0}
                subtitle="Actual files in Drive"
                icon={CheckCircle}
                variant="success"
                trend={monthlyComparison.percentageChange > 0 ? {
                  value: monthlyComparison.percentageChange,
                  isPositive: monthlyComparison.isPositive,
                } : undefined}
                isLoading={isLoading}
              />
            </div>
            <div onClick={() => navigate("/audit?tab=pending")} className="cursor-pointer">
              <StatusCard
                title="Pending Review"
                value={reviewSummary.pending}
                subtitle="Awaiting approval"
                icon={Clock}
                variant="warning"
                isLoading={isLoading}
              />
            </div>
            <div onClick={() => navigate("/audit?tab=compliant")} className="cursor-pointer">
              <StatusCard
                title="Approved"
                value={reviewSummary.completed}
                subtitle="Reviewed & approved"
                icon={CheckCircle}
                variant="success"
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Modules Grid - Live Data */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                System Modules
                {!isLoading && records && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({auditSummary.total} total forms)
                  </span>
                )}
              </h2>
              {!isLoading &&
                moduleStats.map((module) => {
                  const Icon = moduleIcons[module.id] || FileText;
                  const meta = moduleDescriptions[module.id] || {
                    description: "QMS module records and documentation.",
                    isoClause: "ISO 9001:2015",
                  };
 
                  return (
                    <div
                      key={module.id}
                      onClick={() => navigate(`/module/${module.id}`)}
                      className="cursor-pointer"
                    >
                      <ModuleCard
                        title={module.name}
                        description={meta.description}
                        icon={Icon}
                        moduleClass={`module-${module.id}`}
                        stats={{
                          formsCount: module.formsCount,
                          recordsCount: module.recordsCount,
                          pendingCount: module.pendingCount,
                          issuesCount: module.issuesCount,
                        }}
                        isoClause={meta.isoClause}
                      />
                    </div>
                  );
                })}
            </div>
              <div className="space-y-6">
                <QuickActions />
                <AuditReadiness
                  moduleStats={moduleStats}
                  complianceRate={auditSummary.complianceRate}
                  isLoading={isLoading}
                  onRefresh={handleRefresh}
                />
                <PendingActions records={records ?? []} isLoading={isLoading} />
              </div>
            </div>
      </div>

      {/* Recent Activity & Stats */}
          <div className="max-w-7xl mx-auto mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity records={activity} isLoading={isLoading} />
 
              {/* Review Status */}
              <div className="bg-card rounded-lg border border-border">
                <div className="p-5 border-b border-border">
                  <h3 className="font-semibold text-foreground">Review Status</h3>
                  <p className="text-sm text-muted-foreground mt-1">Document review completion</p>
                </div>
                <div className="p-5 space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                          <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors"
                        onClick={() => navigate("/audit?tab=compliant")}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-success" />
                          <span className="text-sm font-medium text-foreground">Approved Records</span>
                        </div>
                        <span className="text-xl font-bold text-success">{reviewSummary.completed}</span>
                      </div>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-warning/10 cursor-pointer hover:bg-warning/20 transition-colors"
                        onClick={() => navigate("/audit?tab=pending")}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-warning" />
                          <span className="text-sm font-medium text-foreground">Pending Review</span>
                        </div>
                        <span className="text-xl font-bold text-warning">{reviewSummary.pending}</span>
                      </div>
                      <div
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate("/audit")}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Form Templates</span>
                        </div>
                        <span className="text-xl font-bold text-foreground">{auditSummary.total}</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-4 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly activity</span>
                    <span className="font-medium text-foreground">
                      {monthlyComparison.currentMonth} updates this month
                      {monthlyComparison.percentageChange > 0 && (
                        <span className={monthlyComparison.isPositive ? "text-success ml-2" : "text-destructive ml-2"}>
                          ({monthlyComparison.isPositive ? "+" : "-"}{monthlyComparison.percentageChange}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </main>
      </div>
    </div>
  );
}
