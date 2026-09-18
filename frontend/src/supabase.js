import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseAnonKey !== "your-anon-key"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Sign up a user with Supabase Auth or graceful fallback
 */
export async function supabaseSignUp(email, password, metadata = {}) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured. Falling back to local backend auth.") };
  }
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

/**
 * Sign in a user with Supabase Auth
 */
export async function supabaseSignIn(email, password) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured. Falling back to local backend auth.") };
  }
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign out from Supabase Auth
 */
export async function supabaseSignOut() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}

/**
 * Reset password via Supabase Auth
 */
export async function supabaseResetPassword(email) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }
  return await supabase.auth.resetPasswordForEmail(email);
}
