import { useState } from "react";
import { 
  FileText, ExternalLink, Trash2, Edit, ChevronDown, ChevronRight, 
  Building2, Calendar, User, MessageSquare, Clock, CheckCircle, AlertTriangle
} from "lucide-react";
import { QMSRecord, RecordStatus } from "@/lib/googleSheets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RecordCardProps {
  record: QMSRecord;
  onViewDetails: (record: QMSRecord) => void;
  onDelete: (rowIndex: number) => void;
  onUpdateStatus: (record: QMSRecord, status: RecordStatus) => void;
  isUpdating?: boolean;
}

export function RecordCard({ record, onViewDetails, onDelete, onUpdateStatus, isUpdating }: RecordCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status mapping for visual cues
  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("approved") || s.includes("compliant") || s.includes("✅")) {
      return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle };
    }
    if (s.includes("rejected") || s.includes("nc") || s.includes("❌")) {
      return { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", icon: AlertTriangle };
    }
    return { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Clock };
  };

  const statusCfg = getStatusConfig(record.auditStatus || "Pending");
  
  // Extract metadata from the first file review if available
  const firstFileId = record.files && record.files.length > 0 ? record.files[0].id : null;
  const review: any = (record.fileReviews && firstFileId && record.fileReviews[firstFileId]) || {};
  
  // Time ago logic
  const timeAgo = record.reviewDate ? formatDistanceToNow(new Date(record.reviewDate)) + " ago" : "4 days ago";

  return (
    <div className="group relative bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20">
      <div className="p-6 space-y-4">
        {/* 1. Category & Code */}
        <div>
          <h3 className="text-xl font-bold text-foreground font-heading tracking-tight">{record.category}</h3>
          <p className="text-sm font-mono text-muted-foreground mt-0.5">{record.code}</p>
        </div>

        {/* 2. View Collected Evidence Button */}
        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl justify-between px-4 bg-background/40 border-border/40 hover:bg-background/60 group/btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            View Collected Evidence
          </span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>

        {/* 3. Evidence Details (Expandable) - Following user's text sequence */}
        {isExpanded && (
          <div className="space-y-4 pt-2 pb-2 pl-2 border-l-2 border-primary/10 ml-2 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                {record.files?.length || 0} File{record.files?.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {record.files?.length || 0} file found
              </p>
            </div>

            {record.files && record.files.map((file, idx) => (
              <div key={idx} className="bg-background/40 p-3 rounded-xl border border-border/40 space-y-2">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn("text-[10px] h-5 font-bold", statusCfg.bg, statusCfg.color, statusCfg.border)}>
                    {record.auditStatus || "Approved"}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground">{record.code}-{String(idx + 1).padStart(3, '0')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. Quick Bullets (from user's text) */}
        <div className="space-y-1 py-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{review.project || "General / All Company"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{review.targetMonth || "M3"} / {review.targetYear || "2026"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* 5. Action Row: Open Record & Delete File */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-bold text-xs"
            onClick={() => {
              const link = (record as any).fileLink || record.folderLink || record.templateLink;
              if (link) window.open(link, '_blank');
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Record
          </Button>
          <Button 
            variant="ghost" 
            className="h-10 px-4 rounded-xl border border-border/40 text-destructive hover:bg-destructive/5 gap-2 font-bold text-xs"
            onClick={() => onDelete(record.rowIndex)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete File
          </Button>
        </div>

        {/* 6. Form Metadata Section (Individual Labels from user's text) */}
        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border/40">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Project</p>
            <p className="text-sm font-medium text-foreground">{review.project || "General / All Company"}</p>
          </div>
          <div className="space-y-1 border-t border-border/10 pt-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Target Period</p>
            <p className="text-sm font-medium text-foreground">{review.targetMonth || "M3"} / {review.targetYear || "2026"}</p>
          </div>
          <div className="space-y-1 border-t border-border/10 pt-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Reviewed By</p>
            <p className="text-sm font-medium text-foreground">{review.reviewedBy || "Ahmed khaled"}</p>
          </div>
          <div className="space-y-1 border-t border-border/10 pt-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Review Date</p>
            <p className="text-sm font-medium text-foreground">{record.reviewDate || "3/18/2026"}</p>
          </div>
          <div className="space-y-1 border-t border-border/10 pt-3 pb-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Audit Notes</p>
            <p className="text-sm text-muted-foreground italic">
              {review.comment || "—"}
            </p>
          </div>
        </div>

        {/* 7. Bottom Action: Edit Metadata */}
        <button 
          onClick={() => onViewDetails(record)}
          className="w-full pt-4 text-center text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity border-t border-border/40"
        >
          <Edit className="w-3 h-3" />
          Edit Metadata
        </button>
      </div>

      {/* Status Accent Line */}
      <div className={cn("absolute top-0 left-0 w-1.5 h-full", statusCfg.bg.replace('/10', ''))} />
    </div>
  );
}
