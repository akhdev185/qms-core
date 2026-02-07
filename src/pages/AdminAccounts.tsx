import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth, AppUser } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield, UserPlus, Eye, EyeOff } from "lucide-react";

export default function AdminAccounts() {
  const { users, addUser, updateUser, removeUser, user, reloadUsers } = useAuth();
  const [activeModule, setActiveModule] = useState("management");
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: AppUser["role"] }>({
    name: "",
    email: "",
    role: "user",
  });
  const [pwVisible, setPwVisible] = useState<Record<string, boolean>>({});

  const isProtectedAdmin = (u: AppUser): boolean => {
    const isSelf = user?.id === u.id;
    const isBuiltInAdmin = u.role === "admin" && (u.email === "admin@local" || u.name.toLowerCase() === "administrator");
    return isSelf || isBuiltInAdmin;
  };
  
  useEffect(() => {
    reloadUsers();
  }, [reloadUsers]);

  const handleAdd = () => {
    if (!newUser.name || !newUser.email) return;
    // New users start inactive until approved
    addUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      password: "123456",
      active: user?.role === "admin",
      needsApprovalNotification: false
    });
    setNewUser({ name: "", email: "", role: "user" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      <main className="md:ml-64 ml-0">
        <Header />
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Shield className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Accounts Administration</h1>
                <p className="text-sm text-muted-foreground">Monitor users, assign roles, and manage activation</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Approve or reject new accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(u => !u.active).map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={() => updateUser(u.id, { active: true, needsApprovalNotification: true })}>Approve</Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (isProtectedAdmin(u)) return;
                            if (window.confirm(`هل تريد حذف الحساب "${u.name}"؟`)) removeUser(u.id);
                          }}
                          disabled={isProtectedAdmin(u)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Add User</CardTitle>
              <CardDescription>Create a new account and set role</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppUser["role"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleAdd}>Add</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users List</CardTitle>
              <CardDescription>Change roles, activate/deactivate accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <Input
                            type={pwVisible[u.id] ? "text" : "password"}
                            value={u.password}
                            onChange={(e) => updateUser(u.id, { password: e.target.value })}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPwVisible(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                          >
                            {pwVisible[u.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => updateUser(u.id, { role: v as AppUser["role"] })}>
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="auditor">Auditor</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch checked={u.active} onCheckedChange={(v) => updateUser(u.id, { active: v, needsApprovalNotification: v ? true : u.needsApprovalNotification })} />
                      </TableCell>
                      <TableCell>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (isProtectedAdmin(u)) return;
                            if (window.confirm(`هل تريد حذف الحساب "${u.name}"؟`)) removeUser(u.id);
                          }}
                          disabled={isProtectedAdmin(u)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
