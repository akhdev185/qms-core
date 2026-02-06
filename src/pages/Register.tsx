import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addUser, users } = useAuth();
  const { toast } = useToast();

  const handleRegister = async () => {
    setIsLoading(true);
    if (!name || !email || !password || password !== confirm) {
      setIsLoading(false);
      toast({ title: "بيانات غير مكتملة", description: "تأكد من إدخال كل الحقول وتطابق كلمة المرور", variant: "destructive" });
      return;
    }
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      setIsLoading(false);
      toast({ title: "الحساب موجود", description: "هذا البريد مسجل مسبقاً", variant: "destructive" });
      return;
    }
    const role = users.length === 0 ? "admin" : "user";
    // New accounts require admin approval
    addUser({ name, email, password, role, active: false, needsApprovalNotification: false });
    setIsLoading(false);
    toast({ title: "تم إنشاء الحساب", description: "يمكنك تسجيل الدخول الآن" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
          <CardDescription>أدخل بياناتك لإنشاء حساب جديد</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleRegister} disabled={isLoading}>
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
            لدي حساب بالفعل
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
