// ===== Supabase Client - Koneksi ke Database Cloud =====
// Menggunakan Supabase JS SDK v2 via CDN

const SUPABASE_URL = 'https://nsbgyvvagnhaipwqesfo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xJTTdhjICRd-_Rwq83JFgA_XJZd8dpd';

// Init Supabase client (akan tersedia setelah SDK load dari CDN)
let supabase = null;

// Tunggu sampai Supabase SDK load
function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Client initialized');
    return true;
  }
  return false;
}

// Helper: cek apakah user sudah login
async function isLoggedIn() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}

// Helper: ambil user ID
async function getUserId() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

// Helper: ambil user email
async function getUserEmail() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email || null;
}

// Helper: cek koneksi internet
function isOnline() {
  return navigator.onLine;
}
