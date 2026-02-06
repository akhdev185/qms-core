import { Search, Bell, HelpCircle, Settings, RefreshCw, Loader2, FileText, Folder, Layout, FileCode, CheckCircle, ExternalLink, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { searchProjectDrive, DriveSearchResult } from "@/lib/driveService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { SettingsModal } from "@/components/settings/SettingsModal";

export function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<DriveSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const driveResults = await searchProjectDrive(searchTerm);
        setResults(driveResults);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all queries to sync everything
      await queryClient.invalidateQueries();
      toast({
        title: "Synchronization Complete",
        description: "Latest data fetched from Google Drive & Sheets.",
        className: "bg-success text-success-foreground"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not sync with Google services.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getFileTypeInfo = (file: DriveSearchResult) => {
    const name = file.name;
    const mime = file.mimeType;

    // Pattern for records: [ModuleCode]/[FormCode]-[SerialNumber] (e.g., F/19-004, AUD/01-01)
    if (name.match(/[A-Z]+\/\d+-\d+/i)) return { label: "Record", color: "bg-success/20 text-success border-success/20" };

    // Pattern for forms: [ModuleCode]/[FormCode] (e.g., F/19, AUD/01)
    if (name.match(/[A-Z]+\/\d+/i) || name.toLowerCase().includes("template")) return { label: "Form Template", color: "bg-accent/20 text-accent border-accent/20" };

    if (mime.includes("folder")) return { label: "Folder", color: "bg-muted text-muted-foreground border-border" };
    if (mime.includes("spreadsheet")) return { label: "Spreadsheet", color: "bg-success/20 text-success border-success/20" };
    if (mime.includes("document")) return { label: "Document", color: "bg-blue-500/20 text-blue-500 border-blue-200" };
    if (mime.includes("pdf")) return { label: "PDF", color: "bg-destructive/20 text-destructive border-destructive/20" };

    return { label: "Drive File", color: "bg-muted text-muted-foreground border-border" };
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("folder")) return <Folder className="w-4 h-4 text-accent" />;
    if (mimeType.includes("spreadsheet")) return <Table className="w-4 h-4 text-success" />;
    if (mimeType.includes("document")) return <FileText className="w-4 h-4 text-blue-500" />;
    if (mimeType.includes("pdf")) return <FileCode className="w-4 h-4 text-destructive" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl relative" ref={dropdownRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search all files and folders in Drive..."
            className="pl-10 bg-background border-border rounded-lg focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
            <div className="max-h-[400px] overflow-y-auto">
              {results.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b border-border">
                    Found {results.length} items in Drive
                  </div>
                  {results.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => window.open(file.webViewLink, '_blank')}
                      className="px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center border border-border">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                            {(() => {
                              const typeInfo = getFileTypeInfo(file);
                              return (
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold border uppercase", typeInfo.color)}>
                                  {typeInfo.label}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              {file.mimeType.split('.').pop()?.replace('spreadsheet', 'sheet').replace('document', 'doc')}
                            </span>
                            {file.path && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                in <Folder className="w-3 h-3" /> <span className="font-semibold text-foreground/70">{file.path}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    </div>
                  ))}
                </>
              ) : searchTerm.length >= 2 && !isSearching ? (
                <div className="p-8 text-center bg-muted/10">
                  <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-foreground">No matches found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a more specific file name</p>
                </div>
              ) : null}
            </div>
            <div className="px-4 py-2 bg-muted/20 border-t border-border flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Press Enter to search Drive</span>
              <span>15 max results</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2 border-border", isRefreshing && "text-accent")}
          onClick={handleGlobalRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh System
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="w-5 h-5" />
        </Button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
          </Button>

          {showNotifications && (
            <div className="absolute top-full right-0 w-80 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/20">
                <h3 className="text-sm font-bold">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll();
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.link) navigate(n.link);
                        markAsRead(n.id);
                        setShowNotifications(false);
                      }}
                      className={cn(
                        "px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors",
                        !n.read && "bg-sidebar-primary/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          n.type === 'archive' ? "bg-amber-500/10 text-amber-500" : "bg-sidebar-primary/10 text-sidebar-primary"
                        )}>
                          {n.type === 'archive' ? <Trash2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-mono tracking-wider">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary self-center" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/10 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div
                  className="px-4 py-2 border-t border-border text-center bg-muted/10 cursor-pointer hover:bg-muted/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/archive');
                    setShowNotifications(false);
                  }}
                >
                  <span className="text-[11px] font-bold text-sidebar-primary uppercase tracking-widest">View Archives</span>
                </div>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-5 h-5" />
        </Button>

        {/* Audit Status Badge */}
        <div className="ml-4 pl-4 border-l border-border">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Audit Ready</span>
          </div>
        </div>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </header>
  );
}
