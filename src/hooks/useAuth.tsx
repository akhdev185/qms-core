import * as React from "react";

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
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: Omit<AppUser, "id">) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  removeUser: (id: string) => void;
  changePassword: (id: string, oldPass: string, newPass: string) => boolean;
  reloadUsers: () => void;
};

const USERS_KEY = "qms_users";
const SESSION_KEY = "qms_session";

function loadUsers(): AppUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function saveUsers(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [user, setUser] = React.useState<AppUser | null>(null);

  React.useEffect(() => {
    const existing = loadUsers();
    if (existing.length === 0) {
      const admin: AppUser = {
        id: crypto.randomUUID(),
        name: "Administrator",
        email: "admin@local",
        password: "admin1500",
        role: "admin",
        active: true,
        lastLoginAt: 0,
      };
      saveUsers([admin]);
      setUsers([admin]);
    } else {
      setUsers(existing);
    }
    const userId = loadSession();
    if (userId) {
      const u = (existing.length ? existing : users).find(x => x.id === userId) || null;
      setUser(u);
    }
  }, []);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === USERS_KEY) {
        const updated = loadUsers();
        setUsers(updated);
        const currentId = loadSession();
        if (currentId) {
          const u = updated.find(x => x.id === currentId) || null;
          setUser(u);
        }
      }
      if (e.key === SESSION_KEY) {
        const currentId = loadSession();
        if (!currentId) {
          setUser(null);
        } else {
          const updated = loadUsers();
          const u = updated.find(x => x.id === currentId) || null;
          setUser(u);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = React.useCallback((email: string, password: string) => {
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.active && x.password === password);
    if (!u) return false;
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
    saveUsers(updated);
    setUser(u);
    saveSession(u.id);
    return true;
  }, [users]);

  const logout = React.useCallback(() => {
    setUser(null);
    saveSession(null);
  }, []);

  const addUser = React.useCallback((userInput: Omit<AppUser, "id">) => {
    const newUser: AppUser = { ...userInput, id: crypto.randomUUID() };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
  }, [users]);

  const updateUser = React.useCallback((id: string, updates: Partial<AppUser>) => {
    const updated = users.map(u => (u.id === id ? { ...u, ...updates } : u));
    setUsers(updated);
    saveUsers(updated);
    if (user && user.id === id) {
      setUser({ ...user, ...updates });
    }
  }, [users, user]);

  const removeUser = React.useCallback((id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    saveUsers(updated);
    if (user && user.id === id) {
      setUser(null);
      saveSession(null);
    }
  }, [users, user]);
  
  const reloadUsers = React.useCallback(() => {
    const updated = loadUsers();
    setUsers(updated);
    const currentId = loadSession();
    if (currentId) {
      const u = updated.find(x => x.id === currentId) || null;
      setUser(u);
    }
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
