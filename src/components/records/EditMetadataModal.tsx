import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { QMSRecord, RecordStatus, updateSheetCell } from "@/lib/googleSheets";
import { Settings, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditMetadataModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: QMSRecord;
    fileId: string;
    fileName: string;
    onSuccess: () => void;
}

export function EditMetadataModal({ isOpen, onClose, record, fileId, fileName, onSuccess }: EditMetadataModalProps) {
    const currentReview = record.fileReviews?.[fileId] || {
        status: 'pending_review',
        comment: '',
        reviewedBy: '',
        reviewDate: new Date().toISOString().split('T')[0]
    };

    const [status, setStatus] = useState<RecordStatus>(currentReview.status as RecordStatus);
    const [comment, setComment] = useState(currentReview.comment || "");
    const [reviewedBy, setReviewedBy] = useState(currentReview.reviewedBy || "");
    const [reviewDate, setReviewDate] = useState(currentReview.reviewDate || new Date().toISOString().split('T')[0]);
    
    // New Metadata state
    const [project, setProject] = useState(currentReview.project || "General / All Company");
    const [targetMonth, setTargetMonth] = useState(currentReview.targetMonth || (new Date().getMonth() + 1).toString());
    const [targetYear, setTargetYear] = useState(currentReview.targetYear || new Date().getFullYear().toString());

    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const PROJECTS = [
        "General / All Company",
        "Omniaz Project - Mapping",
        "Omniaz Project - Annotation",
        "Video Detection Project",
        "Vocal AI Project",
        "Tennis Project",
        "ETH Project"
    ];
    
    const MONTHS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const currentYearNum = new Date().getFullYear();
    const YEARS = Array.from({ length: 6 }, (_, i) => (currentYearNum - 1 + i).toString());

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedReviews = { ...record.fileReviews };
            updatedReviews[fileId] = {
                ...currentReview,
                status,
                comment,
                reviewedBy,
                reviewDate,
                project,
                targetMonth,
                targetYear
            };

            // Column P is index 15, which is 'P'
            const success = await updateSheetCell(
                record.rowIndex,
                'P',
                JSON.stringify(updatedReviews)
            );

            if (success) {
                toast({
                    title: "Metadata Updated",
                    description: `Successfully updated audit details for ${fileName}`,
                });
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Could not save changes to Google Sheets",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-sidebar-primary" />
                        Edit Record Metadata
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate font-mono bg-muted px-2 py-1 rounded">
                        {fileName}
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Audit Status</Label>
                            <Select value={status} onValueChange={(val) => setStatus(val as RecordStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending_review">Pending Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Issue Found</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Review Date</Label>
                            <Input
                                type="date"
                                value={reviewDate}
                                onChange={(e) => setReviewDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reviewer">Reviewed By</Label>
                        <Input
                            placeholder="Enter name..."
                            value={reviewedBy}
                            onChange={(e) => setReviewedBy(e.target.value)}
                        />
                    </div>

                    {/* New Metadata Fields */}
                    <div className="pt-2 border-t border-border mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Project Assignment</Label>
                            <Select value={project} onValueChange={setProject}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECTS.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Target Month</Label>
                                <Select value={targetMonth} onValueChange={setTargetMonth}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => (
                                            <SelectItem key={m} value={m}>Month {m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Target Year</Label>
                                <Select value={targetYear} onValueChange={setTargetYear}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Audit Notes / Comments</Label>
                        <Textarea
                            placeholder="Optional notes about the review..."
                            className="resize-none h-24"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
