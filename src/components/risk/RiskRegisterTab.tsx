import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Loader2, RefreshCw, Search, X, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRiskData } from "@/hooks/useRiskData";
import type { Risk, RiskUpdate } from "@/lib/riskRegisterService";
import { getRiskLevel, getRiskLevelColor } from "@/lib/riskRegisterService";
import { cn } from "@/lib/utils";

export function RiskRegisterTab() {
    const { risks, isLoading, isError, error, refetch, updateRisk, isUpdating } = useRiskData();
    const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredRisks = useMemo(() => {
        let result = risks;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.riskId.toLowerCase().includes(q) ||
                r.riskDescription.toLowerCase().includes(q) ||
                r.processDepartment.toLowerCase().includes(q) ||
                r.owner.toLowerCase().includes(q)
            );
        }
        if (statusFilter !== "all") {
            result = result.filter(r => r.status === statusFilter);
        }
        return result;
    }, [risks, search, statusFilter]);

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

    const handleExportCSV = () => {
        const headers = ["Risk ID", "Department", "Description", "Cause", "L", "I", "Score", "Level", "Action", "Owner", "Status", "Linked CAPA"];
        const rows = filteredRisks.map(r => [
            r.riskId, r.processDepartment, r.riskDescription, r.cause,
            r.likelihood, r.impact, r.riskScore, getRiskLevel(r.riskScore),
            r.actionControl, r.owner, r.status, r.linkedCAPA
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `risk-register-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading Risk Register...</span>
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
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search risks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm bg-background border-border/50"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm bg-background border-border/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Controlled">Controlled</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExportCSV} disabled={filteredRisks.length === 0}>
                        <Download className="w-3.5 h-3.5" /> CSV
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => refetch()}>
                        <RefreshCw className="w-3.5 h-3.5" /> Sync
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border/50">
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-[90px]">ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Dept</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 max-w-[200px]">Description</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 text-center w-[80px]">Score</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 hidden lg:table-cell">Action</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Owner</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-[100px]">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 hidden md:table-cell">CAPA</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 w-[40px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRisks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                                    {search || statusFilter !== "all" ? "No risks match your filters." : "No risks found."}
                                </TableCell>
                            </TableRow>
                        ) : filteredRisks.map((risk) => (
                            <TableRow key={risk.riskId} className="hover:bg-muted/20 transition-colors border-b border-border/30">
                                <TableCell className="font-bold text-xs font-mono">{risk.riskId}</TableCell>
                                <TableCell className="text-xs font-medium">{risk.processDepartment}</TableCell>
                                <TableCell className="max-w-[200px]">
                                    <div className="text-xs font-semibold truncate" title={risk.riskDescription}>{risk.riskDescription}</div>
                                    <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={risk.cause}>{risk.cause}</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn("font-bold text-[10px]", getRiskLevelColor(risk.riskScore))}>
                                        {risk.riskScore}
                                    </Badge>
                                    <div className="text-[8px] text-muted-foreground mt-0.5">{risk.likelihood}×{risk.impact}</div>
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground truncate max-w-[130px] hidden lg:table-cell" title={risk.actionControl}>{risk.actionControl || "—"}</TableCell>
                                <TableCell className="text-xs font-medium">{risk.owner}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(risk.status) as any} className="font-bold uppercase tracking-wider text-[8px]">{risk.status}</Badge>
                                </TableCell>
                                <TableCell className="text-[10px] text-muted-foreground font-mono hidden md:table-cell">{risk.linkedCAPA || "—"}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => handleEditClick(risk)}>
                                        <Pencil className="w-3 h-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredRisks.length > 0 && (
                    <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
                        {search || statusFilter !== "all" ? `${filteredRisks.length} of ${risks.length} risks` : `${risks.length} risks total`}
                    </div>
                )}
            </div>

            {/* Edit Dialog - kept same logic */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-bold text-xl">Edit Risk {editingRisk?.riskId}</DialogTitle>
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
