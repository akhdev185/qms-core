import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, users } = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (target && !target.active) {
      setIsLoading(false);
      toast({ title: "Awaiting admin approval", description: "Your account is not active yet", variant: "destructive" });
      return;
    }
    const ok = login(email, password);
    setIsLoading(false);
    if (!ok) {
      toast({ title: "Login failed", description: "Check email or password", variant: "destructive" });
      return;
    }
    try {
      if (localStorage.getItem(`approval_just_granted:${email}`) === "true") {
        toast({ title: "Admin approved your account", description: "You can now sign in normally" });
        localStorage.removeItem(`approval_just_granted:${email}`);
      }
    } catch {}
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Enter your email and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/register")}>
            Create New Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
