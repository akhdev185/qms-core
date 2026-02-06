import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  ClipboardCheck,
  ShoppingCart,
  GraduationCap,
  Lightbulb,
  Building2,
  ChevronDown,
  Shield,
  Archive,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  moduleClass?: string;
  path?: string;
  children?: { id: string; label: string; code?: string }[];
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  {
    id: "sales",
    label: "Sales & Customer",
    icon: Users,
    moduleClass: "module-sales",
    path: "/module/sales"
  },
  {
    id: "operations",
    label: "Operations",
    icon: Settings,
    moduleClass: "module-operations",
    path: "/module/operations"
  },
  {
    id: "quality",
    label: "Quality & Audit",
    icon: ClipboardCheck,
    moduleClass: "module-quality",
    path: "/module/quality"
  },
  {
    id: "procurement",
    label: "Procurement",
    icon: ShoppingCart,
    moduleClass: "module-procurement",
    path: "/module/procurement"
  },
  {
    id: "hr",
    label: "HR & Training",
    icon: GraduationCap,
    moduleClass: "module-hr",
    path: "/module/hr"
  },
  {
    id: "rnd",
    label: "R&D & Design",
    icon: Lightbulb,
    moduleClass: "module-rnd",
    path: "/module/rnd"
  },
  {
    id: "management",
    label: "Management",
    icon: Building2,
    moduleClass: "module-management",
    path: "/module/management"
  },
  { id: "risk", label: "Risk & Process", icon: AlertTriangle, path: "/risk-management" },
  { id: "archive", label: "Record Archive", icon: Archive, path: "/archive" },
];

interface SidebarProps {
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { user } = useAuth();
  const items: NavItem[] =
    user?.role === "admin"
      ? [
          ...navItems,
          { id: "admin", label: "Admin Accounts", icon: Shield, path: "/admin/accounts" },
        ]
      : navItems;

  // Auto-expand based on current route
  useEffect(() => {
    const pathModule = location.pathname.split("/module/")[1];
    if (pathModule && !expandedItems.includes(pathModule)) {
      setExpandedItems(prev => [...prev, pathModule]);
    }
  }, [location.pathname]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      toggleExpand(item.id);
    }

    if (item.path) {
      navigate(item.path);
      if (item.path.startsWith("/module/")) {
        onModuleChange(item.id);
      }
    }
  };

  const handleChildClick = (parentId: string, child: { code?: string }) => {
    if (child.code) {
      navigate(`/record/${encodeURIComponent(child.code)}`);
    } else {
      navigate(`/module/${parentId}`);
    }
  };

  // Determine active state from URL
  const getActiveState = (item: NavItem): boolean => {
    if (item.id === "dashboard" && location.pathname === "/") return true;
    if (item.path && location.pathname === item.path) return true;
    if (location.pathname.includes(`/module/${item.id}`)) return true;
    return activeModule === item.id;
  };

  return (
    <aside className="hidden md:flex md:w-64 bg-sidebar text-sidebar-foreground flex-col h-screen md:fixed md:left-0 md:top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            navigate("/");
            onModuleChange("dashboard");
          }}
        >
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">QMS Platform</h1>
            <p className="text-xs text-sidebar-foreground/60">ISO 9001:2015</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item) => {
          const isActive = getActiveState(item);
          const isExpanded = expandedItems.includes(item.id);

          return (
            <div key={item.id}>
              <button
                onClick={() => handleNavClick(item)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.children && (
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                )}
              </button>

              {/* Sub-items */}
              {item.children && isExpanded && (
                <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleChildClick(item.id, child)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors"
                    >
                      {child.code && (
                        <span className="text-xs font-mono text-sidebar-primary">{child.code}</span>
                      )}
                      <span>{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium">{(user?.name || "User").slice(0,2).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Guest"}</p>
              <p className="text-xs text-sidebar-foreground/60">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}</p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20">
            <p className="text-[10px] uppercase font-bold text-sidebar-primary tracking-wider mb-1">Created By</p>
            <p className="text-sm font-semibold text-sidebar-foreground">Ahmed Khaled</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
