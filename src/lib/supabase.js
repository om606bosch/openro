// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────────────────────────────────────
// This file is the single Supabase client singleton for the app.
// URL and anon key are injected at build time via Vite env vars.
// Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file
// (or as GitHub Actions secrets for the production build).
//
// During development, the app falls back to localStorage if Supabase is
// not configured — so the app works without credentials in the repo.

let supabase = null;

const url  = import.meta.env.VITE_SUPABASE_URL;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (url && key) {
  // Dynamic import so the build doesn't fail if @supabase/supabase-js is not installed
  const { createClient } = await import("@supabase/supabase-js").catch(() => ({ createClient: null }));
  if (createClient) {
    supabase = createClient(url, key);
  }
}

export default supabase;
export const supabaseConfigured = !!supabase;
