import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileRow } from "@/integrations/supabase/types";

type Role = "admin" | "manager" | "auditor" | "user";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  lastLoginAt?: number;
  needsApprovalNotification?: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  users: AppUser[];
  login: (email: string, password: string) => { ok: boolean; code: string; message: string; user?: AppUser; backend: "supabase" | "local" };
  logout: () => void;
  addUser: (user: Omit<AppUser, "id">) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  changePassword: (id: string, oldPass: string, newPass: string) => boolean;
  reloadUsers: () => void;
};

const USERS_KEY = "qms_users";
const SESSION_KEY = "qms_session";

const apiBase = (import.meta as unknown as { env?: Record<string, unknown> }).env?.DEV ? "http://localhost:3001" : "";

async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function loadUsersLocal(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveUsersLocal(users: AppUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch { void 0; }
}

function loadSession(): string | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as { userId: string };
    return s.userId || null;
  } catch {
    return null;
  }
}

function saveSession(userId: string | null) {
  if (!userId) {
    localStorage.removeItem(SESSION_KEY);
    return;
    }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialLocal = (() => {
    const existing = loadUsersLocal();
    if (existing.length === 0) {
      const seeded: AppUser = {
        id: crypto.randomUUID(),
        name: "admin",
        email: "admin@local",
        password: "admin",
        role: "admin",
        active: true,
        lastLoginAt: 0,
      };
      const merged = [seeded];
      saveUsersLocal(merged);
      return merged;
    }
    return existing;
  })();
  const [users, setUsers] = React.useState<AppUser[]>(initialLocal);
  const [user, setUser] = React.useState<AppUser | null>(null);

  React.useEffect(() => {
    const bootstrap = async () => {
      if (supabase) {
        const selectOnce = async () => {
          const { data, error } = await supabase.from("profiles").select("*");
          return { rows: Array.isArray(data) ? data : [], error };
        };
        let { rows, error } = await selectOnce();
        let hasAdmin = rows.some(r => String(r.email).toLowerCase() === "admin@local");
        if (!hasAdmin) {
          const adminId = crypto.randomUUID();
          const { error: insertErr } = await supabase.from("profiles").insert({
            id: adminId,
            name: "admin",
            email: "admin@local",
            password: "admin",
            role: "admin",
            active: true,
            last_login_at: 0,
          });
          if (!insertErr) {
            const res = await selectOnce();
            rows = res.rows;
            error = res.error;
            hasAdmin = rows.some(r => String(r.email).toLowerCase() === "admin@local");
          }
        }
        if (error || rows.length === 0 || !hasAdmin) {
          const local = loadUsersLocal();
          const hasLocalAdmin = local.some(u => u.email.toLowerCase() === "admin@local");
          if (!hasLocalAdmin) {
            const seeded: AppUser = {
              id: crypto.randomUUID(),
              name: "admin",
              email: "admin@local",
              password: "admin",
              role: "admin",
              active: true,
              lastLoginAt: 0,
            };
            const merged = [...local, seeded];
            saveUsersLocal(merged);
            setUsers(merged);
          } else {
            setUsers(local);
          }
        } else {
          const mapped = rows.map((r: ProfileRow) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            password: r.password || "",
            role: r.role || "user",
            active: !!r.active,
            lastLoginAt: r.last_login_at || 0,
            needsApprovalNotification: false,
          })) as AppUser[];
          setUsers(mapped);
        }
      } else {
        try {
          const existing = await apiFetch<AppUser[]>("/api/users");
          const hasAdmin = existing.some(u => u.email.toLowerCase() === "admin@local");
          if (!hasAdmin) {
            const admin: Omit<AppUser, "id"> = {
              name: "admin",
              email: "admin@local",
              password: "admin",
              role: "admin",
              active: true,
              lastLoginAt: 0,
            };
            try {
              const created = await apiFetch<AppUser>("/api/users", {
                method: "POST",
                body: JSON.stringify(admin),
              });
              setUsers([...existing, created]);
            } catch {
              const seeded: AppUser = { ...admin, id: crypto.randomUUID() };
              const merged = [...existing, seeded];
              saveUsersLocal(merged);
              setUsers(merged);
            }
          } else {
            setUsers(existing);
          }
        } catch {
          const existing = loadUsersLocal();
          let list = existing;
          const hasAdmin = existing.some(u => u.email.toLowerCase() === "admin@local");
          if (!hasAdmin) {
            const seeded: AppUser = {
              id: crypto.randomUUID(),
              name: "admin",
              email: "admin@local",
              password: "admin",
              role: "admin",
              active: true,
              lastLoginAt: 0,
            };
            list = [...existing, seeded];
            saveUsersLocal(list);
          }
          setUsers(list);
        }
      }
    };
    bootstrap();
    const userId = loadSession();
    if (userId) {
      if (supabase) {
        const u = users.find(x => x.id === userId) || null;
        setUser(u);
      } else {
        apiFetch<AppUser[]>("/api/users").then(all => {
          const u = all.find(x => x.id === userId) || null;
          setUser(u);
        }).catch(() => setUser(null));
      }
    }
  }, []);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === USERS_KEY) {
        apiFetch<AppUser[]>("/api/users").then(updated => {
          setUsers(updated);
          const currentId = loadSession();
          if (currentId) {
            const u = updated.find(x => x.id === currentId) || null;
            setUser(u);
          }
        }).catch(() => {
          const updated = loadUsersLocal();
          setUsers(updated);
          const currentId = loadSession();
          if (currentId) {
            const u = updated.find(x => x.id === currentId) || null;
            setUser(u);
          }
        });
      }
      if (e.key === SESSION_KEY) {
        const currentId = loadSession();
        if (!currentId) {
          setUser(null);
        } else {
          apiFetch<AppUser[]>("/api/users").then(updated => {
            const u = updated.find(x => x.id === currentId) || null;
            setUser(u);
          }).catch(() => {
            const updated = loadUsersLocal();
            const u = updated.find(x => x.id === currentId) || null;
            setUser(u);
          });
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = React.useCallback((email: string, password: string) => {
    const backend: "supabase" | "local" = supabase ? "supabase" : "local";
    if (!email.trim()) {
      return { ok: false, code: "email_empty", message: "البريد الإلكتروني فارغ", backend };
    }
    if (!password.trim()) {
      return { ok: false, code: "password_empty", message: "كلمة المرور فارغة", backend };
    }
    const found = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { ok: false, code: "not_found", message: "الحساب غير موجود", backend };
    }
    if (!found.active) {
      return { ok: false, code: "inactive", message: "الحساب غير مُفعّل. انتظر موافقة الأدمن", backend };
    }
    if (found.password !== password) {
      return { ok: false, code: "wrong_password", message: "كلمة المرور غير صحيحة", backend };
    }
    const u = found;
    const updated = users.map(x => {
      if (x.id === u.id) {
        const approvalJustGranted = !!x.needsApprovalNotification;
        if (approvalJustGranted) {
          try {
            localStorage.setItem(`approval_just_granted:${x.email}`, "true");
          } catch { void 0; }
        }
        return { ...x, lastLoginAt: Date.now(), needsApprovalNotification: false };
      }
      return x;
    });
    setUsers(updated);
    if (!supabase) {
      apiFetch<AppUser>("/api/users", {
        method: "PUT",
        body: JSON.stringify({ id: u.id, lastLoginAt: Date.now(), needsApprovalNotification: false }),
      }).catch(() => void 0);
    }
    setUser(u);
    saveSession(u.id);
    return { ok: true, code: "ok", message: "تم تسجيل الدخول", user: u, backend };
  }, [users]);

  const logout = React.useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  const addUser = React.useCallback((userInput: Omit<AppUser, "id">) => {
    const newUser: AppUser = { ...userInput, id: crypto.randomUUID() };
    const updated = [...users, newUser];
    setUsers(updated);
    if (!supabase) {
      apiFetch<AppUser>("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      }).catch(() => saveUsersLocal(updated));
    }
    if (supabase) {
      supabase.from("profiles").insert({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        active: newUser.active,
        last_login_at: newUser.lastLoginAt || 0,
      }).then(() => {}).catch(() => {});
    }
  }, [users]);

  const updateUser = React.useCallback((id: string, updates: Partial<AppUser>) => {
    const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
    setUsers(updated);
    if (!supabase) {
      apiFetch<AppUser>("/api/users", {
        method: "PUT",
        body: JSON.stringify({ id, ...updates }),
      }).catch(() => saveUsersLocal(updated));
    }
    if (supabase) {
      supabase.from("profiles").update({
        name: updates.name,
        email: updates.email,
        password: updates.password,
        role: updates.role,
        active: updates.active,
        last_login_at: updates.lastLoginAt,
      }).eq("id", id).then(() => {}).catch(() => {});
    }
    if (user && user.id === id) {
      setUser({ ...user, ...updates });
    }
  }, [users, user]);

  const removeUser = React.useCallback((id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    if (!supabase) {
      apiFetch("/api/users", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }).catch(() => saveUsersLocal(updated));
    }
    if (supabase) {
      supabase.from("profiles").delete().eq("id", id).then(() => {}).catch(() => {});
    }
    if (user && user.id === id) {
      setUser(null);
      saveSession(null);
    }
  }, [users, user]);
  
  const reloadUsers = React.useCallback(() => {
    const run = async () => {
      if (supabase) {
        const { data } = await supabase.from("profiles").select("*");
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows.map((r: ProfileRow) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          password: r.password || "",
          role: r.role || "user",
          active: !!r.active,
          lastLoginAt: r.last_login_at || 0,
          needsApprovalNotification: false,
        })) as AppUser[];
        setUsers(mapped);
        const currentId = loadSession();
        if (currentId) {
          const u = mapped.find(x => x.id === currentId) || null;
          setUser(u);
        }
      } else {
        try {
          const updated = await apiFetch<AppUser[]>("/api/users");
          setUsers(updated);
          const currentId = loadSession();
          if (currentId) {
            const u = updated.find(x => x.id === currentId) || null;
            setUser(u);
          }
        } catch {
          const updated = loadUsersLocal();
          setUsers(updated);
          const currentId = loadSession();
          if (currentId) {
            const u = updated.find(x => x.id === currentId) || null;
            setUser(u);
          }
        }
      }
    };
    run();
  }, []);

  const value: AuthContextValue = {
    user,
    users,
    login,
    logout,
    addUser,
    updateUser,
    removeUser,
    changePassword: (id, oldPass, newPass) => {
      const u = users.find(x => x.id === id);
      if (!u || u.password !== oldPass) return false;
      updateUser(id, { password: newPass });
      return true;
    },
    reloadUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
