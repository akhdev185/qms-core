import { supabase } from "../supabase/client";

interface OAuthResult {
  error?: Error | string;
  tokens?: { access_token: string; refresh_token: string };
  [key: string]: any;
}

export const lovable = {
  auth: {
    callback: async (result: OAuthResult) => {
      if (result.error) {
        return { error: result.error };
      }

      try {
        console.log("[LOVABLE-AUTH] OAuth callback received, setting session...");
        console.log("[LOVABLE-AUTH] Tokens received:", { 
          hasAccessToken: !!result.tokens?.access_token, 
          hasRefreshToken: !!result.tokens?.refresh_token 
        });

        const supabaseClient = supabase;
        if (!supabaseClient) {
          return { error: new Error("Supabase client not initialized") };
        }

        await supabaseClient.auth.setSession(result.tokens!);
        console.log("[LOVABLE-AUTH] Session set successfully");
        
        const { data: checkSession } = await supabaseClient.auth.getSession();
        console.log("[LOVABLE-AUTH] Session verification:", { 
          hasSession: !!checkSession?.session,
          userId: checkSession?.session?.user?.id,
          email: checkSession?.session?.user?.email 
        });
      } catch (e) {
        console.error("[LOVABLE-AUTH] Error setting session:", e);
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    }
  }
};
