import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/lib/auth";
import { 
  FileText, Folder, ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  ExternalLink, Loader2, RefreshCw, List, Grid, Eye, Pencil,
  ArrowLeft, FileCode, Table as TableIcon, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const API_KEY = "AIzaSyDltPnR5hhwfDrjlwi7lS78R_kDIZbQpWo";
const PROCEDURES_FOLDER_ID = "1PU8pLn43kH0fLy7gmCm_qt3B-2-CHqmr";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string;
  createdTime: string;
  size?: string;
}

function getPreviewUrl(file: DriveItem): string {
  // Google Docs/Sheets/Slides → use /preview
  if (file.mimeType.includes("google-apps.document") || file.mimeType.includes("google-apps.spreadsheet") || file.mimeType.includes("google-apps.presentation")) {
    const id = file.id;
    if (file.mimeType.includes("document")) return `https://docs.google.com/document/d/${id}/preview`;
    if (file.mimeType.includes("spreadsheet")) return `https://docs.google.com/spreadsheets/d/${id}/preview`;
    if (file.mimeType.includes("presentation")) return `https://docs.google.com/presentation/d/${id}/preview`;
  }
  // Word/Excel/PowerPoint uploaded files → use Google Docs viewer
  if (file.mimeType.includes("wordprocessing") || file.mimeType.includes("msword")) {
    return `https://docs.google.com/document/d/${file.id}/preview`;
  }
  if (file.mimeType.includes("spreadsheet") || file.mimeType.includes("ms-excel")) {
    return `https://docs.google.com/spreadsheets/d/${file.id}/preview`;
  }
  if (file.mimeType.includes("presentation") || file.mimeType.includes("ms-powerpoint")) {
    return `https://docs.google.com/presentation/d/${file.id}/preview`;
  }
  // PDF
  if (file.mimeType.includes("pdf")) {
    return `https://drive.google.com/file/d/${file.id}/preview`;
  }
  // Fallback
  return `https://drive.google.com/file/d/${file.id}/preview`;
}

function getEditUrl(file: DriveItem): string {
  return file.webViewLink || `https://drive.google.com/file/d/${file.id}/edit`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("folder")) return <Folder className="w-5 h-5 text-accent" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <TableIcon className="w-5 h-5 text-success" />;
  if (mimeType.includes("document") || mimeType.includes("word")) return <FileText className="w-5 h-5 text-primary" />;
  if (mimeType.includes("pdf")) return <FileCode className="w-5 h-5 text-destructive" />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return <FileText className="w-5 h-5 text-warning" />;
  return <FileText className="w-5 h-5 text-muted-foreground" />;
}

function getFileTypeBadge(mimeType: string) {
  if (mimeType.includes("document") || mimeType.includes("word")) return { label: "DOC", color: "bg-primary/10 text-primary border-primary/20" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return { label: "SHEET", color: "bg-success/10 text-success border-success/20" };
  if (mimeType.includes("pdf")) return { label: "PDF", color: "bg-destructive/10 text-destructive border-destructive/20" };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return { label: "SLIDES", color: "bg-accent/10 text-accent border-accent/20" };
  if (mimeType.includes("folder")) return { label: "FOLDER", color: "bg-muted text-muted-foreground border-border" };
  return { label: "FILE", color: "bg-muted text-muted-foreground border-border" };
}

async function fetchFolderFiles(folderId: string, searchQuery: string = ""): Promise<DriveItem[]> {
  let queryStr = `'${folderId}' in parents and trashed=false`;
  if (searchQuery.trim()) {
    queryStr += ` and fullText contains '${searchQuery.trim()}'`;
  }
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(queryStr)}&fields=files(id,name,mimeType,webViewLink,modifiedTime,createdTime,size)&orderBy=name&key=${API_KEY}&pageSize=100`;
  
  const token = await getAccessToken();
  const options: RequestInit = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  const res = await fetch(url, options);
  if (!res.ok) {
    const errText = await res.text();
    console.error("Drive API error:", errText);
    throw new Error("Failed to fetch folder");
  }
  const data = await res.json();
  return data.files || [];
}

export default function ProceduresPage() {
  const [activeModule, setActiveModule] = useState("procedures");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: PROCEDURES_FOLDER_ID, name: "02. Procedures" }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handler = (e: CustomEvent) => setSidebarCollapsed(e.detail);
    window.addEventListener('qms-sidebar-toggle', handler as EventListener);
    return () => window.removeEventListener('qms-sidebar-toggle', handler as EventListener);
  }, []);

  const currentFolderId = folderStack[folderStack.length - 1].id;

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchFolderFiles(currentFolderId, debouncedSearch);
      // Sort: folders first, then files alphabetically
      items.sort((a, b) => {
        const aFolder = a.mimeType.includes("folder") ? 0 : 1;
        const bFolder = b.mimeType.includes("folder") ? 0 : 1;
        if (aFolder !== bFolder) return aFolder - bFolder;
        return a.name.localeCompare(b.name);
      });
      setFiles(items);
    } catch (err) {
      console.error("Failed to load procedures:", err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, debouncedSearch]);

  useEffect(() => {
    loadFiles();
    setSelectedIndex(null);
  }, [loadFiles]);

  const nonFolderFiles = files.filter(f => !f.mimeType.includes("folder"));
  const selectedFile = selectedIndex !== null ? nonFolderFiles[selectedIndex] : null;

  const handleFileClick = (file: DriveItem) => {
    if (file.mimeType.includes("folder")) {
      setFolderStack(prev => [...prev, { id: file.id, name: file.name }]);
      return;
    }
    const idx = nonFolderFiles.findIndex(f => f.id === file.id);
    setSelectedIndex(idx);
    setMode("preview");
  };

  const goBack = () => {
    if (folderStack.length > 1) {
      setFolderStack(prev => prev.slice(0, -1));
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setMode("preview");
    }
  };
  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < nonFolderFiles.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setMode("preview");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selectedFile) {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
        if (e.key === "Escape") { setSelectedIndex(null); setIsFullscreen(false); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIndex, nonFolderFiles.length]);

  const breadcrumb = folderStack.map(f => f.name);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <div className={cn("flex-1 flex flex-col transition-all duration-300", sidebarCollapsed ? "md:ml-[60px]" : "md:ml-60")}>
        <Header />
        <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
          {/* Breadcrumb & Top Bar */}
          <div className="flex justify-between items-start sm:items-center gap-3 mb-4 flex-col sm:flex-row">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {folderStack.length > 1 && (
                <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {breadcrumb.map((name, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
                    <span className={cn(i === breadcrumb.length - 1 ? "text-foreground font-semibold truncate" : "cursor-pointer hover:text-foreground shrink-0")}
                      onClick={() => i < breadcrumb.length - 1 && setFolderStack(prev => prev.slice(0, i + 1))}
                    >
                      {name}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0 shrink-0">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search inside procedures..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 text-xs bg-muted/40"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={loadFiles} className="h-8 w-8 shrink-0">
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} className="h-8 w-8 shrink-0">
                {viewMode === "list" ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {selectedFile ? (
            /* ===== FILE VIEWER ===== */
            <div className={cn("flex-1 flex flex-col min-h-0", isFullscreen ? "fixed inset-0 z-50 bg-background p-4" : "")}>
              {/* Viewer Header */}
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedIndex(null); setIsFullscreen(false); }} className="gap-1.5 shrink-0">
                    <ArrowLeft className="w-4 h-4" /> Files
                  </Button>
                  <div className="flex items-center gap-2 min-w-0">
                    {getFileIcon(selectedFile.mimeType)}
                    <h2 className="text-sm font-semibold truncate">{selectedFile.name}</h2>
                    {(() => { const b = getFileTypeBadge(selectedFile.mimeType); return <Badge variant="outline" className={cn("text-[10px] shrink-0", b.color)}>{b.label}</Badge>; })()}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md ml-2 border border-border/50 shrink-0">
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Document (Ctrl+F)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">
                    {(selectedIndex ?? 0) + 1} / {nonFolderFiles.length}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={goPrev} disabled={selectedIndex === 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={goNext} disabled={selectedIndex === nonFolderFiles.length - 1}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center rounded-lg border border-border overflow-hidden ml-1">
                    <Button
                      variant={mode === "preview" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("preview")}
                      className="rounded-none gap-1.5 h-8"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    <Button
                      variant={mode === "edit" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMode("edit")}
                      className="rounded-none gap-1.5 h-8"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </div>

                  <Button variant="outline" size="icon" className="h-8 w-8 ml-1" onClick={() => window.open(getEditUrl(selectedFile), '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(!isFullscreen)}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* iframe Preview */}
              <div className="rounded-xl border border-border overflow-hidden bg-card flex-1 min-h-0">
                <iframe
                  key={`${selectedFile.id}-${mode}`}
                  src={mode === "edit" ? getEditUrl(selectedFile) : getPreviewUrl(selectedFile)}
                  className="w-full h-full"
                  title={selectedFile.name}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            </div>
          ) : (
            /* ===== FILE LIST ===== */
            loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-20">
                <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">This folder is empty or not accessible</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Make sure the folder is shared as "Anyone with the link"</p>
              </div>
            ) : viewMode === "list" ? (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/30 text-xs font-semibold text-muted-foreground border-b border-border">
                  <span>Name</span>
                  <span className="w-20 text-center">Type</span>
                  <span className="w-28 text-right">Modified</span>
                </div>
                <ScrollArea className="max-h-[calc(100vh-260px)]">
                  {files.map((file) => {
                    const badge = getFileTypeBadge(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleFileClick(file)}
                        className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 hover:bg-muted/40 cursor-pointer border-b border-border/30 last:border-0 transition-colors items-center"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(file.mimeType)}
                          <span className="text-sm font-medium truncate">{file.name}</span>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] w-20 justify-center", badge.color)}>
                          {badge.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground w-28 text-right">
                          {new Date(file.modifiedTime).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>
            ) : (
              /* Grid view */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {files.map((file) => {
                  const badge = getFileTypeBadge(file.mimeType);
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40 hover:shadow-md cursor-pointer transition-all flex flex-col items-center gap-3 text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <p className="text-xs font-medium truncate w-full">{file.name}</p>
                      <Badge variant="outline" className={cn("text-[9px]", badge.color)}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
