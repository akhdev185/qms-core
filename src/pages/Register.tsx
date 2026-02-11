import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { addUser, users, reloadUsers, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in (e.g. after Google OAuth)
  React.useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleRegister = async () => {
    setIsLoading(true);
    if (!name || !email || !password || password !== confirm) {
      setIsLoading(false);
      toast({ title: "بيانات ناقصة", description: "يرجى ملء جميع الحقول والتأكد من تطابق كلمة المرور", variant: "destructive" });
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
      toast({ title: "فشل التسجيل", description: "الاتصال بقاعدة البيانات غير متاح", variant: "destructive" });
      return;
    }
    const { data: signData, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });
    if (signErr || !signData?.user?.id) {
      setIsLoading(false);
      const msg = signErr?.message || "خطأ في إنشاء الحساب";
      toast({ title: "فشل التسجيل", description: msg, variant: "destructive" });
      return;
    }
    const id = crypto.randomUUID();
    const userId = signData.user.id;
    const { error: insertErr } = await supabase.from("profiles").upsert(
      {
        id,
        user_id: userId,
        email,
        display_name: name,
        is_active: false,
        last_login: new Date(0).toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (insertErr) {
      setIsLoading(false);
      toast({ title: "فشل التسجيل", description: insertErr.message || "خطأ في قاعدة البيانات", variant: "destructive" });
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
    setIsLoading(false);
    toast({ title: "تم إنشاء الحساب", description: "يمكنك تسجيل الدخول بعد تفعيل حسابك من المسؤول" });
    navigate("/login");
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast({ title: "فشل التسجيل عبر Google", description: error.message, variant: "destructive" });
      }
    } catch (err: unknown) {
      toast({ title: "خطأ", description: err instanceof Error ? err.message : "حدث خطأ غير متوقع", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <div className="text-2xl font-bold text-indigo-900">QMS Platform</div>
        <div className="text-sm text-indigo-700">Quality Management System</div>
      </div>
      
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">إنشاء حساب</CardTitle>
          <CardDescription className="text-gray-600">انضم إلى نظام إدارة الجودة</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Google Sign Up */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50 py-5"
            onClick={handleGoogleRegister}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            التسجيل عبر Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">أو</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">الاسم الكامل</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="أدخل اسمك الكامل"
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">البريد الإلكتروني</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="أدخل بريدك الإلكتروني"
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">كلمة المرور</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="أنشئ كلمة مرور"
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-700">تأكيد كلمة المرور</Label>
            <Input 
              id="confirm" 
              type="password" 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              placeholder="أعد إدخال كلمة المرور"
              className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium" 
            onClick={handleRegister} 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جارِ إنشاء الحساب...
              </div>
            ) : (
              "إنشاء حساب"
            )}
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            لديك حساب بالفعل؟{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              سجّل دخولك هنا
            </button>
          </div>
        </CardFooter>
      </Card>
      
      <div className="absolute bottom-6 right-6 text-xs text-gray-500">
        © 2026 QMS Platform. All rights reserved.
      </div>
    </div>
  );
}