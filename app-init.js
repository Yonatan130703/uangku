// ===== App Initialization - Auth Check & UI Setup =====

const AUTH_SCREEN = document.getElementById('auth-screen');
const MAIN_APP = document.getElementById('main-app');
const MIGRATION_MODAL = document.getElementById('migration-modal');

let isOfflineMode = false;

// Show/hide screens
function showAuthScreen() {
  AUTH_SCREEN.style.display = 'flex';
  MAIN_APP.style.display = 'none';
}

function showMainApp() {
  AUTH_SCREEN.style.display = 'none';
  MAIN_APP.style.display = 'block';
  
  // Update account info di tab Lainnya
  updateAccountInfo();
}

async function updateAccountInfo() {
  const email = await getUserEmail();
  const accountEmail = document.querySelector('.account-email');
  const syncStatus = document.getElementById('sync-status');
  
  if (accountEmail && email) {
    accountEmail.textContent = email;
  }
  
  if (syncStatus) {
    syncStatus.textContent = isOnline() ? 'Online' : 'Offline';
    syncStatus.style.color = isOnline() ? 'var(--green)' : 'var(--red)';
  }
}

// Check for local data (migration)
function checkLocalData() {
  const tx = loadTx();
  const wallets = loadWallets() || [];
  return { tx, wallets, hasData: tx.length > 0 || wallets.length > 0 };
}

// Show migration modal
function showMigrationModal() {
  const local = checkLocalData();
  if (!local.hasData) return false;
  
  const countEl = document.getElementById('migration-count');
  countEl.textContent = `${local.tx.length} transaksi & ${local.wallets.length} dompet`;
  
  MIGRATION_MODAL.style.display = 'flex';
  return true;
}

function hideMigrationModal() {
  MIGRATION_MODAL.style.display = 'none';
}

// ===== Event Listeners =====

// Tab switching (Login/Register)
document.getElementById('tab-login').addEventListener('click', () => {
  document.getElementById('tab-login').classList.add('active');
  document.getElementById('tab-register').classList.remove('active');
  document.getElementById('form-login').style.display = 'flex';
  document.getElementById('form-register').style.display = 'none';
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';
});

document.getElementById('tab-register').addEventListener('click', () => {
  document.getElementById('tab-register').classList.add('active');
  document.getElementById('tab-login').classList.remove('active');
  document.getElementById('form-register').style.display = 'flex';
  document.getElementById('form-login').style.display = 'none';
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';
});

// Login form
document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btnEl = document.getElementById('btn-login');
  
  errorEl.textContent = '';
  btnEl.disabled = true;
  btnEl.querySelector('.btn-label').textContent = 'Masuk...';
  
  const result = await loginUser(email, password);
  
  if (result.success) {
    // Check for local data migration
    if (showMigrationModal()) {
      // User will decide via modal buttons
    } else {
      showMainApp();
      render();
    }
  } else {
    errorEl.textContent = result.error || 'Login gagal. Periksa email dan password.';
    btnEl.disabled = false;
    btnEl.querySelector('.btn-label').textContent = 'Masuk';
  }
});

// Register form
document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const password2 = document.getElementById('register-password2').value;
  const errorEl = document.getElementById('register-error');
  const btnEl = document.getElementById('btn-register');
  
  errorEl.textContent = '';
  
  if (password !== password2) {
    errorEl.textContent = 'Password tidak sama.';
    return;
  }
  
  if (password.length < 6) {
    errorEl.textContent = 'Password minimal 6 karakter.';
    return;
  }
  
  btnEl.disabled = true;
  btnEl.querySelector('.btn-label').textContent = 'Mendaftar...';
  
  const result = await registerUser(email, password);
  
  if (result.success) {
    alert('Akun berhasil dibuat! Silakan cek email untuk verifikasi (atau langsung login jika tidak ada email konfirmasi).');
    // Switch to login tab
    document.getElementById('tab-login').click();
    document.getElementById('login-email').value = email;
  } else {
    errorEl.textContent = result.error || 'Pendaftaran gagal.';
  }
  
  btnEl.disabled = false;
  btnEl.querySelector('.btn-label').textContent = 'Daftar';
});

// Offline mode button
document.getElementById('btn-offline').addEventListener('click', () => {
  isOfflineMode = true;
  showMainApp();
  render();
});

// Migration: Upload data
document.getElementById('btn-upload-data').addEventListener('click', async () => {
  const btnEl = document.getElementById('btn-upload-data');
  btnEl.disabled = true;
  btnEl.textContent = 'Mengupload...';
  
  const success = await syncToCloud();
  
  if (success) {
    alert('Data berhasil diupload ke cloud!');
    hideMigrationModal();
    showMainApp();
    render();
  } else {
    alert('Upload gagal. Coba lagi nanti.');
    btnEl.disabled = false;
    btnEl.textContent = 'Upload ke Cloud';
  }
});

// Migration: Skip (clear local data)
document.getElementById('btn-skip-upload').addEventListener('click', () => {
  if (confirm('Data lokal akan dihapus. Yakin ingin melewati?')) {
    localStorage.removeItem(KEY_TX);
    localStorage.removeItem(KEY_W);
    hideMigrationModal();
    showMainApp();
    render();
  }
});

// Logout button
document.getElementById('btn-logout').addEventListener('click', async () => {
  if (!confirm('Keluar dari akun? Data lokal tetap tersimpan di perangkat ini.')) return;
  
  const result = await logoutUser();
  if (result.success) {
    showAuthScreen();
  } else {
    alert('Logout gagal: ' + result.error);
  }
});

// Sync now button
document.getElementById('btn-sync-now').addEventListener('click', async () => {
  const btnEl = document.getElementById('btn-sync-now');
  btnEl.disabled = true;
  btnEl.textContent = 'Sinkronisasi...';
  
  if (await isLoggedIn()) {
    await syncToCloud();
    await syncFromCloud();
    render();
    alert('Sinkronisasi selesai!');
  } else {
    alert('Tidak bisa sinkronisasi. Mode offline aktif.');
  }
  
  btnEl.disabled = false;
  btnEl.textContent = 'Sinkronkan Sekarang';
});

// Online/offline status
window.addEventListener('online', () => {
  updateAccountInfo();
  console.log('[Network] Online');
});

window.addEventListener('offline', () => {
  updateAccountInfo();
  console.log('[Network] Offline');
});

// ===== App Startup =====
(async function initApp() {
  console.log('[App] Initializing...');
  
  // Wait for Supabase SDK to load
  let attempts = 0;
  while (!initSupabase() && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!supabase) {
    console.error('[App] Supabase SDK failed to load. Running offline only.');
    isOfflineMode = true;
    showMainApp();
    render();
    return;
  }
  
  console.log('[App] Supabase ready');
  
  // Setup auth listener
  setupAuthListener();
  
  // Check existing session
  const hasSession = await checkSession();
  
  if (hasSession) {
    console.log('[App] Session found, loading main app');
    showMainApp();
    await syncFromCloud();
    render();
  } else {
    console.log('[App] No session, showing auth screen');
    showAuthScreen();
  }
})();
