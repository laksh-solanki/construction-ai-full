import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Read from Expo extra configuration or environment
const extra = Constants?.expoConfig?.extra || {};
const supabaseUrl = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseAnonKey !== "your-anon-key"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Mobile Supabase SignUp with backend fallback
 */
export async function mobileSupabaseSignUp(email, password, metadata = {}) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured.") };
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
 * Mobile Supabase SignIn with backend fallback
 */
export async function mobileSupabaseSignIn(email, password) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Mobile Supabase SignOut
 */
export async function mobileSupabaseSignOut() {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
}

/**
 * Mobile Supabase Reset Password
 */
export async function mobileSupabaseResetPassword(email) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }
  return await supabase.auth.resetPasswordForEmail(email);
}
