import { supabase } from "../supabase/client";

interface OAuthResult {
  error?: Error;
  tokens?: { access_token: string; refresh_token: string };
}

export const lovable = {
  auth: {
    callback: async (result: OAuthResult) => {
      if (result.error) {
        return { error: result.error };
      }

      try {
        const supabaseClient = supabase;
        if (!supabaseClient) {
          return { error: new Error("Supabase client not initialized") };
        }

        if (result.tokens) {
          await supabaseClient.auth.setSession(result.tokens);
        }
        
        const { data: checkSession } = await supabaseClient.auth.getSession();
        console.log("[LOVABLE-AUTH] Session verification:", { 
          hasSession: !!checkSession?.session,
          userId: checkSession?.session?.user?.id,
        });
      } catch (e) {
        console.error("[LOVABLE-AUTH] Error setting session:", e);
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    }
  }
};
