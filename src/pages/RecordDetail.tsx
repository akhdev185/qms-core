import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useQMSData, useUpdateRecord } from "@/hooks/useQMSData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  FileText, 
  FolderOpen,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function RecordDetail() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState("dashboard");
  
  const { data: records, isLoading, error } = useQMSData();
  const updateRecord = useUpdateRecord();
  
  const [localReviewedBy, setLocalReviewedBy] = useState("");
  const [localReviewDate, setLocalReviewDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const decodedCode = code ? decodeURIComponent(code) : "";
  
  const record = useMemo(() => {
    if (!records) return null;
    return records.find(r => r.code === decodedCode);
  }, [records, decodedCode]);

  // Initialize local state when record loads
  useMemo(() => {
    if (record) {
      setLocalReviewedBy(record.reviewedBy || "");
      setLocalReviewDate(record.reviewDate || "");
    }
  }, [record?.reviewedBy, record?.reviewDate]);

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

  const handleSaveReviewer = async () => {
    if (!record) return;
    setIsSaving(true);
    
    try {
      await updateRecord.mutateAsync({
        rowIndex: record.rowIndex,
        field: "reviewedBy",
        value: localReviewedBy,
      });
      
      await updateRecord.mutateAsync({
        rowIndex: record.rowIndex,
        field: "reviewDate",
        value: localReviewDate || new Date().toISOString().split("T")[0],
      });
      
      toast({
        title: "Saved",
        description: "Reviewer information updated successfully.",
      });
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuditStatusChange = async (newStatus: string) => {
    if (!record) return;
    await updateRecord.mutateAsync({
      rowIndex: record.rowIndex,
      field: "auditStatus",
      value: newStatus,
    });
  };

  const handleReviewedChange = async (checked: boolean) => {
    if (!record) return;
    await updateRecord.mutateAsync({
      rowIndex: record.rowIndex,
      field: "reviewed",
      value: checked ? "TRUE" : "FALSE",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
        <main className="md:ml-64 ml-0">
          <Header />
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
        <main className="md:ml-64 ml-0">
          <Header />
          <div className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Record Not Found</AlertTitle>
              <AlertDescription>
                The record with code "{decodedCode}" was not found in the database.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
      
      <main className="md:ml-64 ml-0">
        <Header />
        
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between animate-fade-in">
            <div className="flex items-start gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-mono font-bold">
                    {record.code}
                  </span>
                  <h1 className="text-2xl font-bold text-foreground">{record.recordName}</h1>
                </div>
                <p className="text-muted-foreground">{record.description}</p>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Record Details */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Record Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="text-foreground font-medium">{record.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Code</Label>
                    <p className="text-foreground font-mono font-medium">{record.code}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">When to Fill</Label>
                    <p className="text-foreground">{record.whenToFill || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Serial</Label>
                    <p className="text-foreground font-mono">{record.lastSerial || "No Files Yet"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Next Serial</Label>
                    <p className="text-foreground font-mono">{record.nextSerial || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last File Date</Label>
                    <p className="text-foreground">{record.lastFileDate || "No files"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Days Ago</Label>
                    <p className="text-foreground">{record.daysAgo || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Document Links</h2>
                <div className="space-y-3">
                  {record.templateLink ? (
                    <a
                      href={record.templateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <FileText className="w-5 h-5 text-accent" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Template Document</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {record.templateLink}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/30 text-muted-foreground">
                      No template link available
                    </div>
                  )}
                  
                  {record.folderLink ? (
                    <a
                      href={record.folderLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <FolderOpen className="w-5 h-5 text-accent" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Storage Folder</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {record.folderLink}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/30 text-muted-foreground">
                      No folder link available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Editable Fields */}
            <div className="space-y-6">
              {/* Audit Status */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Audit Status</h2>
                <Select 
                  value={record.auditStatus || "⚪ Waiting"}
                  onValueChange={handleAuditStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="⚪ Waiting">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-warning" />
                        Waiting
                      </div>
                    </SelectItem>
                    <SelectItem value="✅ Approved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Approved
                      </div>
                    </SelectItem>
                    <SelectItem value="❌ NC">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Non-Conforming
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Changes are saved to Google Sheets
                </p>
              </div>

              {/* Review Status */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Review Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="reviewed"
                      checked={record.reviewed}
                      onCheckedChange={handleReviewedChange}
                    />
                    <Label htmlFor="reviewed" className="cursor-pointer">
                      Mark as Reviewed
                    </Label>
                  </div>
                  
                  <div>
                    <Label htmlFor="reviewedBy">Reviewed By</Label>
                    <Input
                      id="reviewedBy"
                      value={localReviewedBy}
                      onChange={(e) => setLocalReviewedBy(e.target.value)}
                      placeholder="Enter reviewer name"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reviewDate">Review Date</Label>
                    <Input
                      id="reviewDate"
                      type="date"
                      value={localReviewDate}
                      onChange={(e) => setLocalReviewDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveReviewer}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Review Info
                  </Button>
                </div>
              </div>

              {/* Write Permission Notice */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>API Limitations</AlertTitle>
                <AlertDescription className="text-xs">
                  Write operations require OAuth authentication. 
                  API Key access is read-only. Changes may show errors.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
