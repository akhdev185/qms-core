import { createClient } from "@supabase/supabase-js"

const envObj: Record<string, unknown> = (import.meta as unknown as { env?: Record<string, unknown> }).env || {}
const SUPABASE_URL_RAW = typeof envObj.VITE_SUPABASE_URL === "string" ? envObj.VITE_SUPABASE_URL : undefined
const SUPABASE_KEY_RAW = typeof envObj.VITE_SUPABASE_PUBLISHABLE_KEY === "string" ? envObj.VITE_SUPABASE_PUBLISHABLE_KEY : undefined
const SUPABASE_URL = SUPABASE_URL_RAW ? String(SUPABASE_URL_RAW).replace(/`/g, "").trim() : undefined
const SUPABASE_PUBLISHABLE_KEY = SUPABASE_KEY_RAW ? String(SUPABASE_KEY_RAW).trim() : undefined

export const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null
