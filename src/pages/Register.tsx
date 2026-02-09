import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addUser, users, reloadUsers } = useAuth();
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
    if (!supabase) {
      setIsLoading(false);
      toast({ title: "فشل إنشاء الحساب", description: "الربط بـ Supabase غير مضبوط. تأكد من VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY", variant: "destructive" });
      return;
    }
    const { data: signData, error: signErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signErr || !signData?.user?.id) {
      setIsLoading(false);
      const msg = signErr?.message || "حدث خطأ أثناء إنشاء مستخدم Supabase";
      toast({ title: "فشل إنشاء الحساب", description: msg, variant: "destructive" });
      return;
    }
    const id = crypto.randomUUID();
    const userId = signData.user.id;
    const { error: insertErr } = await supabase.from("profiles").upsert(
      {
        id,
        user_id: userId,
        email,
        is_active: false,
        last_login: new Date(0).toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (insertErr) {
      setIsLoading(false);
      const info = [
        insertErr.message ? `الرسالة: ${insertErr.message}` : "",
        insertErr.code ? `الكود: ${insertErr.code}` : "",
        insertErr.details ? `تفاصيل: ${insertErr.details}` : "",
        insertErr.hint ? `تلميح: ${insertErr.hint}` : "",
      ].filter(Boolean).join(" — ");
      const desc = info || "قاعدة البيانات مطلوبة حالياً. تحقق من سياسات RLS والصلاحيات";
      toast({ title: "فشل إنشاء الحساب", description: desc, variant: "destructive" });
      return;
    }
    try {
      const { data: rolesExist } = await supabase.from("user_roles").select("id").eq("user_id", userId).limit(1);
      if (Array.isArray(rolesExist) && rolesExist.length > 0) {
        await supabase.from("user_roles").update({ role: "user" }).eq("user_id", userId);
      } else {
        await supabase.from("user_roles").insert({
          id: crypto.randomUUID(),
          user_id: userId,
          role: "user",
        });
      }
    } catch { void 0; }
    await reloadUsers();
    const { data } = await supabase.from("profiles").select("id").eq("user_id", userId).limit(1);
    const confirmed = Array.isArray(data) && data.length > 0;
    setIsLoading(false);
    if (!confirmed) {
      toast({ title: "فشل إنشاء الحساب", description: "قاعدة البيانات مطلوبة حالياً. حاول مرة أخرى", variant: "destructive" });
      return;
    }
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
