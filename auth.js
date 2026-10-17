// ===== Authentication - Login, Register, Logout =====

const KEY_SESSION = 'uangku_session_v1';

// Register user baru
async function registerUser(email, password) {
  if (!supabase) return { success: false, error: 'Supabase belum siap' };
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  
  if (error) {
    console.error('[Auth] Register error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('[Auth] Register success:', data);
  return { success: true, user: data.user };
}

// Login user
async function loginUser(email, password) {
  if (!supabase) return { success: false, error: 'Supabase belum siap' };
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) {
    console.error('[Auth] Login error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('[Auth] Login success:', data);
  
  // Setelah login, sync data dari cloud
  await syncFromCloud();
  
  return { success: true, user: data.user };
}

// Logout user
async function logoutUser() {
  if (!supabase) return { success: false, error: 'Supabase belum siap' };
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('[Auth] Logout error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('[Auth] Logout success');
  
  // Hapus data lokal (opsional - bisa dikomen kalau mau tetap simpan offline)
  // localStorage.removeItem(KEY_TX);
  // localStorage.removeItem(KEY_W);
  
  return { success: true };
}

// Cek session saat app load
async function checkSession() {
  if (!supabase) return false;
  
  const { data } = await supabase.auth.getSession();
  
  if (data.session) {
    console.log('[Auth] Session active:', data.session.user.email);
    return true;
  }
  
  console.log('[Auth] No active session');
  return false;
}

// Listen auth state changes
function setupAuthListener() {
  if (!supabase) return;
  
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Auth] State change:', event, session?.user?.email);
    
    if (event === 'SIGNED_IN') {
      showMainApp();
      syncFromCloud();
    } else if (event === 'SIGNED_OUT') {
      showAuthScreen();
    }
  });
}
