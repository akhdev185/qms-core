import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { RiskRegisterTab } from "@/components/risk/RiskRegisterTab";
import { CapaRegisterTab } from "@/components/risk/CapaRegisterTab";
import { ProcessInteractionTab } from "@/components/risk/ProcessInteractionTab";
import { Shield, AlertTriangle, FileText, Activity } from "lucide-react";

export default function RiskManagementPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("risk");

    // Sync tab with URL query param if needed, or just internal state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab && ["risk", "capa", "process"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        navigate(`/risk-management?tab=${value}`);
    };

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar activeModule="risk" onModuleChange={() => { }} />
            <main className="flex-1 flex flex-col transition-all duration-300 md:ml-64 ml-0">
                <Header />
                <div className="p-8 space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Risk & Process Management</h1>
                        <p className="text-muted-foreground">
                            Monitor risks, track corrective actions, and visualize process interactions.
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                            <TabsTrigger value="risk" className="gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Risk Register
                            </TabsTrigger>
                            <TabsTrigger value="capa" className="gap-2">
                                <Shield className="w-4 h-4" />
                                CAPA Register
                            </TabsTrigger>
                            <TabsTrigger value="process" className="gap-2">
                                <Activity className="w-4 h-4" />
                                Process Map
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="risk" className="space-y-4 animate-in fade-in-50 duration-300">
                            <RiskRegisterTab />
                        </TabsContent>

                        <TabsContent value="capa" className="space-y-4 animate-in fade-in-50 duration-300">
                            <CapaRegisterTab />
                        </TabsContent>

                        <TabsContent value="process" className="space-y-4 animate-in fade-in-50 duration-300">
                            <ProcessInteractionTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
