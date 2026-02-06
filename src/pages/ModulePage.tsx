import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useQMSData } from "@/hooks/useQMSData";
import { RecordsTable } from "@/components/records/RecordsTable";
import { RecordBrowser } from "@/components/records/RecordBrowser";
import {
  ArrowLeft,
  Users,
  Settings,
  ClipboardCheck,
  ShoppingCart,
  GraduationCap,
  Lightbulb,
  Building2,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { AddRecordModal } from "@/components/records/AddRecordModal";
import { AddFormModal } from "@/components/records/AddFormModal";
import { EditFrequencyModal } from "@/components/records/EditFrequencyModal";
import type { QMSRecord } from "@/lib/googleSheets";
import type { LucideIcon } from "lucide-react";

const moduleConfig: Record<string, {
  name: string;
  icon: LucideIcon;
  description: string;
  isoClause: string;
  categoryPatterns: string[];
}> = {
  sales: {
    name: "Sales & Customer Service",
    icon: Users,
    description: "Manage customer lifecycle from requirements capture to post-delivery feedback.",
    isoClause: "Clause 8.2, 9.1.2",
    categoryPatterns: ["sales", "01"],
  },
  operations: {
    name: "Operations & Production",
    icon: Settings,
    description: "Plan, control, and execute operational activities with project timelines.",
    isoClause: "Clause 8.1, 8.5",
    categoryPatterns: ["operations", "02"],
  },
  quality: {
    name: "Quality & Audit",
    icon: ClipboardCheck,
    description: "Core module for quality control, nonconformity handling, and corrective actions.",
    isoClause: "Clause 9, 10",
    categoryPatterns: ["quality", "03"],
  },
  procurement: {
    name: "Procurement & Vendors",
    icon: ShoppingCart,
    description: "Ensure all purchased items and vendors meet quality requirements.",
    isoClause: "Clause 8.4",
    categoryPatterns: ["procurement", "04"],
  },
  hr: {
    name: "HR & Training",
    icon: GraduationCap,
    description: "Track personnel competence, training records, and performance appraisals.",
    isoClause: "Clause 7.2, 7.3",
    categoryPatterns: ["hr", "05", "training"],
  },
  rnd: {
    name: "R&D & Design",
    icon: Lightbulb,
    description: "Manage innovation, development requests, and technical validation.",
    isoClause: "Clause 8.3",
    categoryPatterns: ["r&d", "rnd", "06", "design"],
  },
  management: {
    name: "Management & Documentation",
    icon: Building2,
    description: "Control governance, documentation, KPI tracking, and leadership decisions.",
    isoClause: "Clause 5, 6, 7.5",
    categoryPatterns: ["management", "07", "documentation"],
  },
};

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState(moduleId || "dashboard");
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isAddFormModalOpen, setIsAddFormModalOpen] = useState(false);
  const [editingFreqRecord, setEditingFreqRecord] = useState<QMSRecord | null>(null);

  const { data: records, isLoading, error, dataUpdatedAt } = useQMSData();

  const module = moduleId ? moduleConfig[moduleId] : null;

  // Filter records for this module
  const filteredRecords = useMemo(() => {
    if (!records || !module) return [];

    return records.filter(record => {
      const category = record.category.toLowerCase();
      return module.categoryPatterns.some(pattern =>
        category.includes(pattern.toLowerCase())
      );
    });
  }, [records, module]);

  // Flatten all files from all records in this module for direct display
  const moduleFiles = useMemo(() => {
    if (!filteredRecords) return [];

    // Sort all files across all forms by creation date
    const allFiles: any[] = [];
    filteredRecords.forEach(record => {
      (record.files || []).forEach(file => {
        allFiles.push({
          ...file,
          parentRecord: record
        });
      });
    });

    return allFiles.sort((a, b) =>
      new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
    );
  }, [filteredRecords]);

  // Group flattened files by their parent form code
  const groupedModuleFiles = useMemo(() => {
    const groups: Record<string, { record: QMSRecord, files: any[] }> = {};

    moduleFiles.forEach((file: any) => {
      const code = file.parentRecord.code;
      if (!groups[code]) {
        groups[code] = {
          record: file.parentRecord,
          files: []
        };
      }
      groups[code].files.push(file);
    });

    return groups;
  }, [moduleFiles]);

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

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Module Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested module does not exist.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const Icon = module.icon;

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
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{module.name}</h1>
                    <p className="text-sm text-muted-foreground">{module.isoClause}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-2">{module.description}</p>
                {lastUpdated && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Last synced: {lastUpdated}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Failed to fetch data from Google Sheets: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredRecords.length}</p>
                <p className="text-sm text-muted-foreground">Form Templates</p>
              </div>
            </div>
          </div>

          {(() => {
            const stats = filteredRecords.reduce((acc, record) => {
              const files = record.files || [];
              const reviews = record.fileReviews || {};

              acc.totalFiles += files.length;
              files.forEach(file => {
                const review = reviews[file.id] || { status: 'pending_review' };
                if (review.status === 'approved') acc.approvedCount++;
                else acc.pendingCount++;
              });
              return acc;
            }, { totalFiles: 0, pendingCount: 0, approvedCount: 0 });

            return (
              <>
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{stats.totalFiles}</p>
                      <p className="text-sm text-muted-foreground">Filled Records</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">{stats.pendingCount}</p>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-info">{stats.approvedCount}</p>
                      <p className="text-sm text-muted-foreground">Approved</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Main Content Grid: Forms vs Records */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Column: Form Templates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sidebar-primary" />
                <h2 className="text-xl font-bold text-foreground">Form Templates</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setIsAddFormModalOpen(true)}
              >
                <Settings className="w-4 h-4" />
                Add New Form
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl border border-border" />)
              ) : filteredRecords.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-8 text-center">
                  <p className="text-muted-foreground">No templates found.</p>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <div key={record.code} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{record.recordName}</h3>
                          <span className="text-xs font-mono bg-sidebar-primary/10 text-sidebar-primary px-1.5 py-0.5 rounded">{record.code}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">{record.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-border/50">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">When to Fill</p>
                        <p className="text-xs font-medium">{record.whenToFill || "As needed"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Status</p>
                        {record.isOverdue ? (
                          <span className="text-xs font-bold text-destructive flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : record.daysUntilNextFill !== undefined ? (
                          <span className="text-xs font-bold text-success">
                            {record.daysUntilNextFill} days remaining
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Ready</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 gap-2" onClick={() => window.open(record.templateLink, '_blank')}>
                        <FileText className="w-4 h-4" />
                        Open Template
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => setEditingFreqRecord(record)}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Edit Frequency
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Filled Records */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-success" />
                <h2 className="text-xl font-bold text-foreground">Filled Records</h2>
              </div>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90 gap-2"
                onClick={() => setIsAddRecordModalOpen(true)}
              >
                <Settings className="w-4 h-4" />
                New Record
              </Button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-56 bg-muted animate-pulse rounded-xl border border-border" />)
              ) : moduleFiles.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No records found for this module.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedModuleFiles).map(([code, group]: [string, any]) => (
                    <div key={code} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-sidebar-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground">{group.record.recordName}</h3>
                          <p className="text-[10px] font-mono text-sidebar-primary uppercase tracking-wider">{code}</p>
                        </div>
                        <div className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {group.files.length} record{group.files.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {group.files.map((file: any) => (
                          <RecordBrowser
                            key={file.id}
                            record={{
                              ...group.record,
                              files: [file]
                            }}
                            isFlat
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <AddRecordModal
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
          templates={filteredRecords}
          onSuccess={handleRefresh}
        />

        <AddFormModal
          isOpen={isAddFormModalOpen}
          onClose={() => setIsAddFormModalOpen(false)}
          onSuccess={handleRefresh}
          category={module.name}
        />

        {editingFreqRecord && (
          <EditFrequencyModal
            isOpen={!!editingFreqRecord}
            onClose={() => setEditingFreqRecord(null)}
            record={editingFreqRecord}
          />
        )}
      </main>
    </div>
  );
}
