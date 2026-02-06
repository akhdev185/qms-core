import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useQMSData } from "@/hooks/useQMSData";
import { RecordsTable } from "@/components/records/RecordsTable";
import {
  ArrowLeft,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

export default function AuditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState("quality");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "pending" || tabParam === "compliant" || tabParam === "issues") {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const { data: records, isLoading, error, dataUpdatedAt } = useQMSData();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["qms-data"] });
  };

  const handleModuleChange = (newModuleId: string) => {
    setActiveModule(newModuleId);
    if (newModuleId === "dashboard") {
      navigate("/");
    } else if (newModuleId !== "documents") {
      navigate(`/module/${newModuleId}`);
    }
  };

  // Categorize records by audit status at the individual FILE level
  const { pendingRecords, compliantRecords, issueRecords, stats } = useMemo(() => {
    if (!records) return {
      pendingRecords: [],
      compliantRecords: [],
      issueRecords: [],
      stats: { pending: 0, compliant: 0, issues: 0 }
    };

    const pending: any[] = [];
    const compliant: any[] = [];
    const issuesList: any[] = [];

    records.forEach(record => {
      const files = record.files || [];
      const reviews = record.fileReviews || {};

      files.forEach(file => {
        const review = reviews[file.id] || { status: 'pending_review', comment: '' };

        const auditItem = {
          ...record,
          fileId: file.id,
          fileName: file.name,
          fileLink: file.webViewLink,
          fileStatus: review.status,
          fileComment: review.comment,
          fileReviewedBy: review.reviewedBy || record.reviewedBy || "",
          isAtomic: true // Flag for RecordsTable
        };

        if (review.status === 'approved') {
          compliant.push(auditItem);
        } else if (review.status === 'rejected') {
          issuesList.push(auditItem);
        } else {
          pending.push(auditItem);
        }
      });
    });

    return {
      pendingRecords: pending,
      compliantRecords: compliant,
      issueRecords: issuesList,
      stats: {
        pending: pending.length,
        compliant: compliant.length,
        issues: issuesList.length
      }
    };
  }, [records]);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  const totalRecords = stats.compliant + stats.pending;
  const complianceRate = totalRecords > 0
    ? Math.round((stats.compliant / totalRecords) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />

      <main className="md:ml-64 ml-0">
        <Header />

        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-start justify-between animate-fade-in">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="mt-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Audit Dashboard</h1>
                    <p className="text-sm text-muted-foreground">ISO 9001:2015 Compliance Review</p>
                  </div>
                </div>
                {lastUpdated && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Last synced: {lastUpdated}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Filter className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{records?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Form Templates</p>
                </div>
              </div>
            </div>
            <div
              className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setActiveTab("pending")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Records</p>
                </div>
              </div>
            </div>
            <div
              className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setActiveTab("compliant")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{stats.compliant}</p>
                  <p className="text-sm text-muted-foreground">Approved Records</p>
                </div>
              </div>
            </div>
            <div
              className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setActiveTab("issues")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.issues}</p>
                  <p className="text-sm text-muted-foreground">Form Issues</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Rate */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Overall Compliance Rate</h2>
              <span className="text-3xl font-bold text-success">{complianceRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className="bg-success h-4 rounded-full transition-all duration-500"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.compliant} of {totalRecords} actual records are compliant
            </p>
          </div>

          {/* Tabbed Records View */}
          <div className="bg-card rounded-lg border border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-border px-4">
                <TabsList className="bg-transparent h-12">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending ({pendingRecords.length} records)
                  </TabsTrigger>
                  <TabsTrigger
                    value="compliant"
                    className="data-[state=active]:bg-success/10 data-[state=active]:text-success"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approved ({compliantRecords.length} records)
                  </TabsTrigger>
                  <TabsTrigger
                    value="issues"
                    className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Issues ({issueRecords.length} records)
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pending" className="m-0">
                <RecordsTable records={pendingRecords} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="compliant" className="m-0">
                <RecordsTable records={compliantRecords} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="issues" className="m-0">
                <RecordsTable records={issueRecords} isLoading={isLoading} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
