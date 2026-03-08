import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Loader2, RefreshCw } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRiskData } from "@/hooks/useRiskData";
import type { Risk, RiskUpdate } from "@/lib/riskRegisterService";
import { getRiskLevel, getRiskLevelColor } from "@/lib/riskRegisterService";

export function RiskRegisterTab() {
    const { risks, isLoading, isError, error, refetch, updateRisk, isUpdating } = useRiskData();
    const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Controlled": return "default";
            case "Open": return "destructive";
            case "Under Review": return "secondary";
            case "Closed": return "outline";
            default: return "outline";
        }
    };

    const handleEditClick = (risk: Risk) => {
        setEditingRisk({ ...risk });
        setIsEditOpen(true);
    };

    const handleSave = () => {
        if (!editingRisk) return;
        const updates: RiskUpdate = {
            processDepartment: editingRisk.processDepartment,
            riskDescription: editingRisk.riskDescription,
            cause: editingRisk.cause,
            likelihood: editingRisk.likelihood,
            impact: editingRisk.impact,
            actionControl: editingRisk.actionControl,
            owner: editingRisk.owner,
            status: editingRisk.status,
            reviewDate: editingRisk.reviewDate,
            linkedCAPA: editingRisk.linkedCAPA,
        };
        updateRisk({ riskId: editingRisk.riskId, updates });
        setIsEditOpen(false);
        setEditingRisk(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading Risk Register from Google Sheets...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-20 space-y-4">
                <p className="text-destructive font-medium">Failed to load Risk Register</p>
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
                    <h3 className="font-bold text-xl font-heading text-foreground">Risk Register</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">
                        Live data from Google Sheets • {risks.length} risks
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
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 w-[100px]">ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Dept</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 max-w-[200px]">Description</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 text-center">Score</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Action / Control</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Owner</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Linked CAPA</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {risks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                                    No risks found in the Risk Register sheet.
                                </TableCell>
                            </TableRow>
                        ) : risks.map((risk) => (
                            <TableRow key={risk.riskId} className="hover:bg-primary/5 transition-colors border-b border-border/10">
                                <TableCell className="font-bold font-heading">{risk.riskId}</TableCell>
                                <TableCell className="text-sm font-medium">{risk.processDepartment}</TableCell>
                                <TableCell className="max-w-[200px]">
                                    <div className="font-bold text-sm truncate" title={risk.riskDescription}>{risk.riskDescription}</div>
                                    <div className="text-[10px] text-muted-foreground truncate opacity-60" title={risk.cause}>{risk.cause}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex flex-col items-center">
                                        <Badge variant="outline" className={`font-bold ${getRiskLevelColor(risk.riskScore)}`}>
                                            {risk.riskScore} • {getRiskLevel(risk.riskScore)}
                                        </Badge>
                                        <span className="text-[9px] text-muted-foreground font-medium">({risk.likelihood}×{risk.impact})</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs truncate max-w-[150px] text-muted-foreground" title={risk.actionControl}>{risk.actionControl}</TableCell>
                                <TableCell className="text-xs font-medium">{risk.owner}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(risk.status) as any} className="font-bold uppercase tracking-wider text-[9px]">{risk.status}</Badge>
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{risk.linkedCAPA || "—"}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary transition-colors" onClick={() => handleEditClick(risk)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold text-2xl">Edit Risk {editingRisk?.riskId}</DialogTitle>
                    </DialogHeader>
                    {editingRisk && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risk ID</Label>
                                    <Input value={editingRisk.riskId} disabled className="bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Department</Label>
                                    <Input value={editingRisk.processDepartment} onChange={(e) => setEditingRisk({ ...editingRisk, processDepartment: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                                <Textarea value={editingRisk.riskDescription} onChange={(e) => setEditingRisk({ ...editingRisk, riskDescription: e.target.value })} className="min-h-[80px]" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cause</Label>
                                <Textarea value={editingRisk.cause} onChange={(e) => setEditingRisk({ ...editingRisk, cause: e.target.value })} className="min-h-[60px]" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Likelihood (1-5)</Label>
                                    <Input type="number" min="1" max="5" value={editingRisk.likelihood} onChange={(e) => setEditingRisk({ ...editingRisk, likelihood: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact (1-5)</Label>
                                    <Input type="number" min="1" max="5" value={editingRisk.impact} onChange={(e) => setEditingRisk({ ...editingRisk, impact: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</Label>
                                    <div className="flex h-10 w-full rounded-md border border-input bg-muted/20 px-3 py-2 text-sm font-bold text-primary">
                                        {editingRisk.likelihood * editingRisk.impact}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action / Control</Label>
                                <Textarea value={editingRisk.actionControl} onChange={(e) => setEditingRisk({ ...editingRisk, actionControl: e.target.value })} className="min-h-[80px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owner</Label>
                                    <Input value={editingRisk.owner} onChange={(e) => setEditingRisk({ ...editingRisk, owner: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                                    <Select value={editingRisk.status} onValueChange={(val: any) => setEditingRisk({ ...editingRisk, status: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Open">Open</SelectItem>
                                            <SelectItem value="Under Review">Under Review</SelectItem>
                                            <SelectItem value="Controlled">Controlled</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Review Date</Label>
                                    <Input value={editingRisk.reviewDate} onChange={(e) => setEditingRisk({ ...editingRisk, reviewDate: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linked CAPA</Label>
                                    <Input value={editingRisk.linkedCAPA} onChange={(e) => setEditingRisk({ ...editingRisk, linkedCAPA: e.target.value })} />
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
