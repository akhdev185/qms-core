import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Loader2, RefreshCw } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCAPAData } from "@/hooks/useCAPAData";
import type { CAPA, CAPAUpdate } from "@/lib/capaRegisterService";
import { getCAPAStatusColor } from "@/lib/capaRegisterService";

export function CapaRegisterTab() {
    const { capas, isLoading, isError, error, refetch, updateCAPA, isUpdating } = useCAPAData();
    const [editingCapa, setEditingCapa] = useState<CAPA | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleEditClick = (capa: CAPA) => {
        setEditingCapa({ ...capa });
        setIsEditOpen(true);
    };

    const handleSave = () => {
        if (!editingCapa) return;
        const updates: CAPAUpdate = {
            sourceOfCAPA: editingCapa.sourceOfCAPA,
            type: editingCapa.type,
            description: editingCapa.description,
            reference: editingCapa.reference,
            rootCauseAnalysis: editingCapa.rootCauseAnalysis,
            correctiveAction: editingCapa.correctiveAction,
            preventiveAction: editingCapa.preventiveAction,
            responsiblePerson: editingCapa.responsiblePerson,
            targetCompletionDate: editingCapa.targetCompletionDate,
            status: editingCapa.status,
            effectivenessCheck: editingCapa.effectivenessCheck,
            effectivenessReviewDate: editingCapa.effectivenessReviewDate,
            closureApproval: editingCapa.closureApproval,
            relatedRisk: editingCapa.relatedRisk,
        };
        updateCAPA({ capaId: editingCapa.capaId, updates });
        setIsEditOpen(false);
        setEditingCapa(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading CAPA Register from Google Sheets...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-20 space-y-4">
                <p className="text-destructive font-medium">Failed to load CAPA Register</p>
                <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center p-6 rounded-2xl bg-muted/20 border-border/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-2xl" />
                <div className="relative z-10">
                    <h3 className="font-bold text-xl font-heading text-foreground">CAPA Register</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                        Live data from Google Sheets • {capas.length} records
                    </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 relative z-10" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-xl">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border/50">
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 w-[120px]">CAPA ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Type</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 max-w-[250px]">Description & Root Cause</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 max-w-[200px]">Actions (CA/PA)</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Responsible</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Target Date</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Effectiveness</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {capas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-20 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                        <Plus className="w-12 h-12 stroke-[1px]" />
                                        <p className="text-sm font-medium">No CAPA records found in Google Sheets.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : capas.map((capa) => (
                            <TableRow key={capa.capaId} className="hover:bg-primary/5 transition-colors border-b border-border/10">
                                <TableCell className="font-bold font-heading">{capa.capaId}</TableCell>
                                <TableCell className="text-sm font-medium">{capa.type}</TableCell>
                                <TableCell>
                                    <div className="text-sm font-bold">{capa.description}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 opacity-60">RC: {capa.rootCauseAnalysis}</div>
                                </TableCell>
                                <TableCell>
                                    {capa.correctiveAction && <div className="text-xs text-muted-foreground"><span className="font-bold text-foreground">CA:</span> {capa.correctiveAction}</div>}
                                    {capa.preventiveAction && <div className="text-xs text-muted-foreground mt-1"><span className="font-bold text-foreground">PA:</span> {capa.preventiveAction}</div>}
                                </TableCell>
                                <TableCell className="text-xs font-medium">{capa.responsiblePerson}</TableCell>
                                <TableCell className="text-xs font-bold text-muted-foreground">{capa.targetCompletionDate}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[9px] ${getCAPAStatusColor(capa.status)}`}>
                                        {capa.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] font-medium text-muted-foreground">{capa.effectivenessCheck || "—"}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary transition-colors" onClick={() => handleEditClick(capa)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold text-2xl">Edit CAPA {editingCapa?.capaId}</DialogTitle>
                    </DialogHeader>
                    {editingCapa && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CAPA ID</Label>
                                    <Input value={editingCapa.capaId} disabled className="bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source</Label>
                                    <Input value={editingCapa.sourceOfCAPA} onChange={(e) => setEditingCapa({ ...editingCapa, sourceOfCAPA: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</Label>
                                    <Select value={editingCapa.type} onValueChange={(val: any) => setEditingCapa({ ...editingCapa, type: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Corrective">Corrective</SelectItem>
                                            <SelectItem value="Preventive">Preventive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                                <Textarea value={editingCapa.description} onChange={(e) => setEditingCapa({ ...editingCapa, description: e.target.value })} className="min-h-[80px]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Root Cause Analysis</Label>
                                <Textarea value={editingCapa.rootCauseAnalysis} onChange={(e) => setEditingCapa({ ...editingCapa, rootCauseAnalysis: e.target.value })} className="min-h-[60px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Corrective Action</Label>
                                    <Textarea value={editingCapa.correctiveAction} onChange={(e) => setEditingCapa({ ...editingCapa, correctiveAction: e.target.value })} className="min-h-[60px]" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preventive Action</Label>
                                    <Textarea value={editingCapa.preventiveAction} onChange={(e) => setEditingCapa({ ...editingCapa, preventiveAction: e.target.value })} className="min-h-[60px]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Responsible</Label>
                                    <Input value={editingCapa.responsiblePerson} onChange={(e) => setEditingCapa({ ...editingCapa, responsiblePerson: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Date</Label>
                                    <Input value={editingCapa.targetCompletionDate} onChange={(e) => setEditingCapa({ ...editingCapa, targetCompletionDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                                    <Select value={editingCapa.status} onValueChange={(val: any) => setEditingCapa({ ...editingCapa, status: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Under Verification">Under Verification</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Effectiveness Check</Label>
                                    <Input value={editingCapa.effectivenessCheck} onChange={(e) => setEditingCapa({ ...editingCapa, effectivenessCheck: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Effectiveness Date</Label>
                                    <Input value={editingCapa.effectivenessReviewDate} onChange={(e) => setEditingCapa({ ...editingCapa, effectivenessReviewDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Related Risk</Label>
                                    <Input value={editingCapa.relatedRisk} onChange={(e) => setEditingCapa({ ...editingCapa, relatedRisk: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
