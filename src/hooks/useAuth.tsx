import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ProfileRow = Tables<'profiles'>;

type Role = "admin" | "manager" | "auditor" | "user" | "moderator";

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
  login: (email: string, password: string) => Promise<{ ok: boolean; code: string; message: string; user?: AppUser; backend: "supabase" | "local" }>;
  logout: () => void;
  addUser: (user: Omit<AppUser, "id">) => Promise<void>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  changePassword: (id: string, oldPass: string, newPass: string) => Promise<boolean>;
  reloadUsers: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; message: string }>;
  loading: boolean;
};

const USERS_KEY = "qms_users";
const SESSION_KEY = "qms_session";
const ACTIVATED_KEY = "qms_activated_emails";

const AUTH_LOCAL_DISABLED = (((import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_AUTH_LOCAL_DISABLED) ?? "true") === "true";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = (((import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_AUTH_SALT) as string) || "qms-salt-2026-v1";
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
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
  } catch { /* non-critical */ }
}

function loadSession(): { userId: string; role: Role; displayName?: string } | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as { userId: string; role?: Role; displayName?: string };
    if (!s.userId) return null;
    return { userId: s.userId, role: s.role || "user", displayName: s.displayName };
  } catch {
    return null;
  }
}

function saveSession(userId: string | null, role?: Role, displayName?: string) {
  if (!userId) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, role, displayName }));
}

function loadActivatedEmails(): string[] {
  try {
    const raw = localStorage.getItem(ACTIVATED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((e: string) => String(e).toLowerCase()) : [];
  } catch {
    return [];
  }
}

function saveActivatedEmails(emails: string[]) {
  try {
    const norm = emails.map(e => e.toLowerCase());
    localStorage.setItem(ACTIVATED_KEY, JSON.stringify(norm));
  } catch { /* non-critical */ }
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialLocal = (() => {
    if (AUTH_LOCAL_DISABLED) return [];
    const existing = loadUsersLocal();
    if (existing.length === 0) {
      const seeded: AppUser = {
        id: crypto.randomUUID(),
        name: "admin",
        email: "admin@local",
        password: "SET_ON_FIRST_LOGIN",
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
  const [loading, setLoading] = React.useState<boolean>(true);
  const [supabaseDisabled, setSupabaseDisabled] = React.useState(false);
  const isFetchingRef = React.useRef<string | null>(null);
  const syncUserProfileRef = React.useRef<(session: any) => Promise<void>>();
  const lastSyncTimestampRef = React.useRef<number>(0);

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    );
    return Promise.race([promise, timeout]);
  };

  const withRetry = async <T,>(fn: () => Promise<T>, retries: number = 1, delayMs: number = 1000): Promise<T> => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        if (i === retries) throw err;
        console.warn(`[AUTH] Retry ${i + 1}/${retries} after error:`, err?.message);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
    throw new Error("Unreachable");
  };

  const fetchFullUsersList = React.useCallback(async () => {
    if (!supabase || supabaseDisabled) return;

    try {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
      const roleMap = new Map();
      if (!rErr && roles) {
        roles.forEach((r: any) => roleMap.set(r.user_id, r.role?.toLowerCase()));
      }

      const mapped = (profiles || []).map((r: ProfileRow) => ({
        id: r.user_id || r.id,
        name: r.display_name || (typeof r.email === "string" ? String(r.email).split("@")[0] : "user"),
        email: r.email || "",
        password: "",
        role: (roleMap.get(r.user_id || r.id) || "user") as Role,
        active: !!(r.is_active ?? false),
        lastLoginAt: r.last_login ? new Date(r.last_login).getTime() : 0,
        needsApprovalNotification: false,
      }));

      setUsers(mapped);
      if (!AUTH_LOCAL_DISABLED) saveUsersLocal(mapped);
    } catch (e) {
      console.error("Error fetching users list");
    }
  }, [supabaseDisabled]);

  const syncUserProfile = React.useCallback(async (session: any) => {
    if (!session?.user) {
      setUser(null);
      saveSession(null);
      return;
    }

    const authUserId = session.user.id;
    const email = session.user.email || "";

    const now = Date.now();
    if (isFetchingRef.current === authUserId || (now - lastSyncTimestampRef.current < 10000)) {
      const cached = loadSession();
      if (cached && cached.userId === authUserId && !user) {
        setUser({
          id: authUserId,
          name: cached.displayName || email.split("@")[0] || "User",
          email, password: "", role: cached.role, active: true, lastLoginAt: Date.now(),
        });
      }
      return;
    }
    isFetchingRef.current = authUserId;
    lastSyncTimestampRef.current = now;

    const cached = loadSession();
    if (cached && cached.userId === authUserId) {
      setUser({
        id: authUserId,
        name: cached.displayName || email.split("@")[0] || "User",
        email, password: "", role: cached.role, active: true, lastLoginAt: Date.now(),
      });
    }

    try {
      const [profileRes, roleRes]: any[] = await withRetry(() => Promise.all([
        supabase!.from("profiles").select("*").eq("user_id", authUserId).maybeSingle().then(r => r),
        supabase!.from("user_roles").select("role").eq("user_id", authUserId).maybeSingle().then(r => r),
      ]), 1, 1000);

      const profile = profileRes?.data;
      const roleData = roleRes?.data;

      if (profile) {
        const isActive = !!(profile.is_active ?? false);
        if (!isActive) {
          console.warn("[AUTH] User is inactive, signing out.");
          await supabase!.auth.signOut();
          saveSession(null);
          setUser(null);
          return;
        }

        const appRole = (roleData?.role as Role) || "user";
        const appUser: AppUser = {
          id: authUserId,
          name: profile.display_name || email.split("@")[0] || "User",
          email, password: "", role: appRole, active: isActive,
          lastLoginAt: profile.last_login ? new Date(profile.last_login).getTime() : Date.now(),
        };

        setUser(appUser);
        saveSession(appUser.id, appUser.role, appUser.name);
        setUsers(prev => prev.some(u => u.id === appUser.id) ? prev : [appUser, ...prev]);
        fetchFullUsersList();
      } else {
        const fallbackUser: AppUser = {
          id: authUserId,
          name: email.split("@")[0] || "User",
          email, password: "", role: "user", active: true,
        };
        setUser(fallbackUser);
      }
    } catch (err: any) {
      console.warn("[AUTH] Profile sync failed, using cache:", err?.message);
    } finally {
      isFetchingRef.current = null;
    }
  }, [fetchFullUsersList, user]);

  syncUserProfileRef.current = syncUserProfile;

  React.useEffect(() => {
    let mounted = true;
    let bootstrapDone = false;

    const bootstrap = async () => {
      if (!supabase || supabaseDisabled) {
        const local = loadUsersLocal();
        const sessionData = loadSession();
        if (sessionData && local.length > 0) {
          const found = local.find(x => x.id === sessionData.userId);
          if (found) setUser(found);
        }
        setUsers(local);
        setLoading(false);
        return;
      }

      try {
        const cached = loadSession();
        if (cached) {
          setUser({
            id: cached.userId,
            name: cached.displayName || "User",
            email: "", password: "", role: cached.role, active: true,
          });
          setLoading(false);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session) {
          await syncUserProfileRef.current?.(session).catch(() => {});
        } else if (mounted && !session) {
          setUser(null);
          saveSession(null);
        }
        if (mounted) setLoading(false);
      } catch (err) {
        console.error("Bootstrap error");
        if (mounted) setLoading(false);
      }
      bootstrapDone = true;
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;
      if (!bootstrapDone && event === 'SIGNED_IN') return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await syncUserProfileRef.current?.(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        saveSession(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
   
  }, [supabaseDisabled]);

  const reloadUsers = React.useCallback(async () => {
    const run = async () => {
      if (supabase && !supabaseDisabled) {
        try {
          const { data, error, status } = await supabase.from("profiles").select("*");
          if (error) {
            if (status === 403 || status === 401) {
              console.warn(`Supabase ${status} error on reload. Falling back.`);
            }
            setSupabaseDisabled(true);
            if (!AUTH_LOCAL_DISABLED) {
              const local = loadUsersLocal();
              setUsers(local);
              const sessionData = loadSession();
              if (sessionData) {
                const currentId = sessionData.userId;
                const u = local.find(x => x.id === currentId) || null;
                setUser(u);
              }
            } else {
              setUsers([]);
            }
            return;
          }
          const rows = Array.isArray(data) ? data : [];
          let rolesRows: any[] = [];
          try {
            const { data: rolesData } = await supabase.from("user_roles").select("*");
            rolesRows = Array.isArray(rolesData) ? rolesData : [];
          } catch { /* non-critical */ }
          const roleByUserId = new Map<string, string>();
          rolesRows.forEach((r: any) => {
            if (r && typeof r.user_id === "string" && typeof r.role === "string") {
              roleByUserId.set(r.user_id, r.role.toLowerCase());
            }
          });
          const mapped = rows.map((r: ProfileRow) => {
            const lastLogin = r.last_login ? new Date(r.last_login).getTime() : 0;
            const role = roleByUserId.get(r.user_id || r.id) || "user";
            return {
              id: r.user_id || r.id,
              name: r.display_name || (typeof r.email === "string" ? String(r.email).split("@")[0] : "user"),
              email: r.email || "",
              password: "",
              role: role as Role,
              active: !!(r.is_active ?? false),
              lastLoginAt: lastLogin,
              needsApprovalNotification: false,
            } as AppUser;
          });
          setUsers(mapped);
          setSupabaseDisabled(false);
          const sessionData = loadSession();
          if (sessionData) {
            const currentId = sessionData.userId;
            const u = mapped.find(x => x.id === currentId) || null;
            setUser(u);
          }
        } catch (e) {
          console.error("Error reloading users");
          setSupabaseDisabled(true);
        }
      } else {
        if (!AUTH_LOCAL_DISABLED) {
          const local = loadUsersLocal();
          setUsers(local);
          const sessionData = loadSession();
          if (sessionData) {
            const currentId = sessionData.userId;
            const u = local.find(x => x.id === currentId) || null;
            setUser(u);
          }
        } else {
          setUsers([]);
        }
      }
    };
    await run();
  }, [supabaseDisabled]);

  const register = React.useCallback(async (email: string, password: string, name: string): Promise<{ ok: boolean; message: string }> => {
    if (!supabase) return { ok: false, message: "Supabase connection unavailable" };

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { ok: false, message: error.message };
      if (!data.user) return { ok: false, message: "Could not create user account" };

      const authUserId = data.user.id;

      const { error: pErr } = await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        user_id: authUserId,
        email,
        display_name: name,
        is_active: false,
        last_login: null
      });

      if (pErr) return { ok: false, message: `Profile creation failed: ${pErr.message}` };

      const { error: rErr } = await supabase.from("user_roles").insert({
        id: crypto.randomUUID(),
        user_id: authUserId,
        role: "user"
      });

      if (rErr) return { ok: false, message: `Role assignment failed: ${rErr.message}` };

      return { ok: true, message: "Registration successful. Pending admin approval." };
    } catch (err: any) {
      return { ok: false, message: err?.message || "An unexpected error occurred during registration" };
    }
  }, []);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        const sessionData = loadSession();
        if (!sessionData) {
          setUser(null);
        } else {
          const currentId = sessionData.userId;
          const u = users.find(x => x.id === currentId) || null;
          setUser(u);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [users]);

  const login = React.useCallback(async (email: string, password: string): Promise<{ ok: boolean; code: string; message: string; user?: AppUser; backend: "supabase" | "local" }> => {
    const backend: "supabase" | "local" = supabase ? "supabase" : "local";
    if (!email.trim()) {
      return { ok: false, code: "email_empty", message: "البريد الإلكتروني فارغ", backend };
    }
    if (!password.trim()) {
      return { ok: false, code: "password_empty", message: "كلمة المرور فارغة", backend };
    }

    if (backend === "supabase") {
      try {
        const { data: authRes, error: authErr } = await supabase!.auth.signInWithPassword({ email, password });
        if (authErr) {
          return { ok: false, code: "auth_error", message: authErr.message, backend };
        }
        if (!authRes.user) {
          return { ok: false, code: "no_user", message: "فشل تسجيل الدخول", backend };
        }

        const authUserId = authRes.user.id;

        // Profile check
        const { data: profile } = await supabase!.from("profiles").select("*").eq("user_id", authUserId).maybeSingle();

        if (!profile) {
          return { ok: false, code: "no_profile", message: "لا يوجد حساب مرتبط", backend };
        }

        if (!profile.is_active) {
          await supabase!.auth.signOut();
          return { ok: false, code: "inactive", message: "الحساب غير مفعل. انتظر موافقة المسؤول.", backend };
        }

        const { data: roleData } = await supabase!.from("user_roles").select("role").eq("user_id", authUserId).maybeSingle();
        const role = (roleData?.role as Role) || "user";

        const appUser: AppUser = {
          id: authUserId,
          name: profile.display_name || email.split("@")[0],
          email,
          password: "",
          role,
          active: true,
          lastLoginAt: Date.now(),
        };

        setUser(appUser);
        saveSession(appUser.id, appUser.role, appUser.name);

        // Update last_login
        supabase!.from("profiles").update({ last_login: new Date().toISOString() }).eq("user_id", authUserId).then(() => {});

        return { ok: true, code: "success", message: "تم تسجيل الدخول بنجاح", user: appUser, backend };
      } catch (e: any) {
        return { ok: false, code: "error", message: e?.message || "خطأ غير متوقع", backend };
      }
    }

    // Local fallback
    if (AUTH_LOCAL_DISABLED) {
      return { ok: false, code: "local_disabled", message: "Local auth is disabled", backend: "local" };
    }

    const hashedPassword = await hashPassword(password);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { ok: false, code: "user_not_found", message: "المستخدم غير موجود", backend: "local" };
    }
    if (!found.active) {
      return { ok: false, code: "inactive", message: "الحساب غير مفعل", backend: "local" };
    }

    // Check password
    if (found.password === "SET_ON_FIRST_LOGIN") {
      // First login for admin seed
      const hashed = await hashPassword(password);
      const updated = users.map(u => u.id === found.id ? { ...u, password: hashed, lastLoginAt: Date.now() } : u);
      setUsers(updated);
      saveUsersLocal(updated);
      const loggedIn = { ...found, password: hashed, lastLoginAt: Date.now() };
      setUser(loggedIn);
      saveSession(loggedIn.id, loggedIn.role, loggedIn.name);
      return { ok: true, code: "success", message: "تم تسجيل الدخول بنجاح", user: loggedIn, backend: "local" };
    }

    if (hashedPassword !== found.password) {
      return { ok: false, code: "wrong_password", message: "كلمة المرور غير صحيحة", backend: "local" };
    }

    const updated = users.map(u => u.id === found.id ? { ...u, lastLoginAt: Date.now() } : u);
    setUsers(updated);
    saveUsersLocal(updated);
    const loggedIn = { ...found, lastLoginAt: Date.now() };
    setUser(loggedIn);
    saveSession(loggedIn.id, loggedIn.role, loggedIn.name);
    return { ok: true, code: "success", message: "تم تسجيل الدخول بنجاح", user: loggedIn, backend: "local" };
  }, [users]);

  const logout = React.useCallback(() => {
    setUser(null);
    saveSession(null);
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  }, []);

  const addUser = React.useCallback(async (newUser: Omit<AppUser, "id">) => {
    if (supabase && !supabaseDisabled) {
      try {
        const { data, error } = await supabase.auth.admin?.createUser?.({
          email: newUser.email,
          password: newUser.password,
          email_confirm: true,
        }) || { data: null, error: null };

        if (error) throw error;

        const authUserId = data?.user?.id || crypto.randomUUID();

        await supabase.from("profiles").insert({
          id: crypto.randomUUID(),
          user_id: authUserId,
          email: newUser.email,
          display_name: newUser.name,
          is_active: newUser.active,
        });

        await supabase.from("user_roles").insert({
          id: crypto.randomUUID(),
          user_id: authUserId,
          role: newUser.role,
        });

        await fetchFullUsersList();
        return;
      } catch (e) {
        console.error("Error adding user via Supabase");
      }
    }

    if (!AUTH_LOCAL_DISABLED) {
      const hashed = await hashPassword(newUser.password);
      const created: AppUser = { ...newUser, id: crypto.randomUUID(), password: hashed };
      const updated = [...users, created];
      setUsers(updated);
      saveUsersLocal(updated);
    }
  }, [users, supabaseDisabled, fetchFullUsersList]);

  const updateUser = React.useCallback(async (id: string, updates: Partial<AppUser>) => {
    if (supabase && !supabaseDisabled) {
      try {
        const profileUpdates: any = {};
        if (updates.name !== undefined) profileUpdates.display_name = updates.name;
        if (updates.email !== undefined) profileUpdates.email = updates.email;
        if (updates.active !== undefined) profileUpdates.is_active = updates.active;

        if (Object.keys(profileUpdates).length > 0) {
          await supabase.from("profiles").update(profileUpdates).eq("user_id", id);
        }

        if (updates.role !== undefined) {
          await supabase.from("user_roles").update({ role: updates.role }).eq("user_id", id);
        }

        await fetchFullUsersList();
        return;
      } catch (e) {
        console.error("Error updating user");
      }
    }

    if (!AUTH_LOCAL_DISABLED) {
      const updated = users.map(u => u.id === id ? { ...u, ...updates } : u);
      setUsers(updated);
      saveUsersLocal(updated);
      if (user?.id === id) {
        setUser(prev => prev ? { ...prev, ...updates } : prev);
      }
    }
  }, [users, user, supabaseDisabled, fetchFullUsersList]);

  const removeUser = React.useCallback(async (id: string) => {
    if (supabase && !supabaseDisabled) {
      try {
        await supabase.from("user_roles").delete().eq("user_id", id);
        await supabase.from("profiles").delete().eq("user_id", id);
        await fetchFullUsersList();
        return;
      } catch (e) {
        console.error("Error removing user");
      }
    }

    if (!AUTH_LOCAL_DISABLED) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      saveUsersLocal(updated);
    }
  }, [users, supabaseDisabled, fetchFullUsersList]);

  const resetPassword = React.useCallback(async (email: string): Promise<{ ok: boolean; message: string }> => {
    if (supabase && !supabaseDisabled) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { ok: false, message: error.message };
        return { ok: true, message: "تم إرسال رابط إعادة تعيين كلمة المرور" };
      } catch (e) {
        console.error("Error");
        return { ok: false, message: "حدث خطأ غير متوقع" };
      }
    }

    if (!AUTH_LOCAL_DISABLED) {
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) return { ok: false, message: "البريد الإلكتروني غير مسجل" };
      return { ok: true, message: "سيتم إعادة تعيين كلمة المرور (محلي)" };
    }
    return { ok: false, message: "غير متاح" };
  }, [users, supabaseDisabled]);

  const value: AuthContextValue = {
    user,
    users,
    login,
    logout,
    addUser,
    updateUser,
    removeUser,
    resetPassword,
    changePassword: async (id, oldPass, newPass) => {
      const u = users.find(x => x.id === id);
      if (!u) return false;
      const hashedOld = await hashPassword(oldPass);
      if (hashedOld !== u.password) return false;
      const hashedNew = await hashPassword(newPass);
      await updateUser(id, { password: hashedNew });
      return true;
    },
    reloadUsers,
    register,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
