// ===== Sync Logic - LocalStorage ↔️ Supabase Cloud =====

let isSyncing = false;

// Upload wallets ke cloud
async function syncWalletsToCloud(wallets) {
  if (!supabase || !isOnline()) return false;
  
  const userId = await getUserId();
  if (!userId) return false;
  
  try {
    // Tambahkan user_id ke setiap wallet
    const walletsWithUserId = wallets.map(w => ({
      id: w.id,
      user_id: userId,
      nama: w.nama,
      tipe: w.tipe,
      saldo: w.saldo,
      icon: w.icon || 'auto',
      warna: w.warna || '#4f46e5'
    }));
    
    // Upsert (insert or update) ke Supabase
    const { error } = await supabase
      .from('wallets')
      .upsert(walletsWithUserId, { onConflict: 'id' });
    
    if (error) {
      console.error('[Sync] Wallets upload error:', error);
      return false;
    }
    
    console.log('[Sync] Wallets uploaded:', wallets.length);
    return true;
  } catch (e) {
    console.error('[Sync] Wallets upload exception:', e);
    return false;
  }
}

// Upload transactions ke cloud
async function syncTransactionsToCloud(transactions) {
  if (!supabase || !isOnline()) return false;
  
  const userId = await getUserId();
  if (!userId) return false;
  
  try {
    // Tambahkan user_id ke setiap transaksi
    const txWithUserId = transactions.map(t => ({
      id: t.id.toString(), // pastikan string untuk UUID compatibility
      user_id: userId,
      wallet_id: t.walletId || null,
      wallet_name: t.walletName || '',
      nominal: t.nominal,
      jenis: t.jenis,
      bayar: t.bayar || 'cash',
      keterangan: t.keterangan || '',
      tanggal: t.tanggal || '',
      ts: t.ts || Date.now(),
      synced: true
    }));
    
    // Upsert batch (max 1000 per request)
    const { error } = await supabase
      .from('transactions')
      .upsert(txWithUserId, { onConflict: 'id' });
    
    if (error) {
      console.error('[Sync] Transactions upload error:', error);
      return false;
    }
    
    console.log('[Sync] Transactions uploaded:', transactions.length);
    return true;
  } catch (e) {
    console.error('[Sync] Transactions upload exception:', e);
    return false;
  }
}

// Download wallets dari cloud
async function syncWalletsFromCloud() {
  if (!supabase || !isOnline()) return [];
  
  const userId = await getUserId();
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('[Sync] Wallets download error:', error);
      return [];
    }
    
    // Konversi format Supabase → localStorage format
    const wallets = data.map(w => ({
      id: w.id,
      nama: w.nama,
      tipe: w.tipe,
      saldo: w.saldo,
      icon: w.icon,
      warna: w.warna
    }));
    
    console.log('[Sync] Wallets downloaded:', wallets.length);
    return wallets;
  } catch (e) {
    console.error('[Sync] Wallets download exception:', e);
    return [];
  }
}

// Download transactions dari cloud
async function syncTransactionsFromCloud() {
  if (!supabase || !isOnline()) return [];
  
  const userId = await getUserId();
  if (!userId) return [];
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('ts', { ascending: false });
    
    if (error) {
      console.error('[Sync] Transactions download error:', error);
      return [];
    }
    
    // Konversi format Supabase → localStorage format
    const transactions = data.map(t => ({
      id: parseInt(t.id) || t.id, // pastikan format sama dengan localStorage
      walletId: t.wallet_id,
      walletName: t.wallet_name,
      nominal: t.nominal,
      jenis: t.jenis,
      bayar: t.bayar,
      keterangan: t.keterangan,
      tanggal: t.tanggal,
      ts: t.ts
    }));
    
    console.log('[Sync] Transactions downloaded:', transactions.length);
    return transactions;
  } catch (e) {
    console.error('[Sync] Transactions download exception:', e);
    return [];
  }
}

// Sync penuh: download dari cloud → merge dengan local
async function syncFromCloud() {
  if (isSyncing) {
    console.log('[Sync] Already syncing, skip');
    return;
  }
  
  isSyncing = true;
  console.log('[Sync] Starting full sync from cloud...');
  
  try {
    // Download wallets
    const cloudWallets = await syncWalletsFromCloud();
    if (cloudWallets.length > 0) {
      saveWallets(cloudWallets);
    }
    
    // Download transactions
    const cloudTx = await syncTransactionsFromCloud();
    if (cloudTx.length > 0) {
      saveTx(cloudTx);
    }
    
    // Re-render UI
    if (typeof render === 'function') {
      render();
    }
    
    console.log('[Sync] Full sync completed');
  } catch (e) {
    console.error('[Sync] Full sync error:', e);
  } finally {
    isSyncing = false;
  }
}

// Sync penuh: upload dari local → cloud
async function syncToCloud() {
  if (isSyncing) {
    console.log('[Sync] Already syncing, skip');
    return;
  }
  
  isSyncing = true;
  console.log('[Sync] Starting full sync to cloud...');
  
  try {
    const wallets = loadWallets() || [];
    const tx = loadTx() || [];
    
    await syncWalletsToCloud(wallets);
    await syncTransactionsToCloud(tx);
    
    console.log('[Sync] Full sync to cloud completed');
    return true;
  } catch (e) {
    console.error('[Sync] Full sync to cloud error:', e);
    return false;
  } finally {
    isSyncing = false;
  }
}

// Auto-sync saat save transaksi (dipanggil dari app.js)
async function autoSyncTransaction(tx) {
  if (!isOnline() || !await isLoggedIn()) return;
  
  const userId = await getUserId();
  if (!userId) return;
  
  // Upload transaksi ini ke cloud (background)
  const txWithUserId = {
    id: tx.id.toString(),
    user_id: userId,
    wallet_id: tx.walletId || null,
    wallet_name: tx.walletName || '',
    nominal: tx.nominal,
    jenis: tx.jenis,
    bayar: tx.bayar || 'cash',
    keterangan: tx.keterangan || '',
    tanggal: tx.tanggal || '',
    ts: tx.ts || Date.now(),
    synced: true
  };
  
  try {
    await supabase.from('transactions').upsert([txWithUserId]);
    console.log('[Sync] Auto-synced transaction:', tx.id);
  } catch (e) {
    console.error('[Sync] Auto-sync transaction error:', e);
  }
}

// Auto-sync saat save wallet (dipanggil dari app.js)
async function autoSyncWallet(wallet) {
  if (!isOnline() || !await isLoggedIn()) return;
  
  const userId = await getUserId();
  if (!userId) return;
  
  // Upload wallet ini ke cloud (background)
  const walletWithUserId = {
    id: wallet.id,
    user_id: userId,
    nama: wallet.nama,
    tipe: wallet.tipe,
    saldo: wallet.saldo,
    icon: wallet.icon || 'auto',
    warna: wallet.warna || '#4f46e5'
  };
  
  try {
    await supabase.from('wallets').upsert([walletWithUserId]);
    console.log('[Sync] Auto-synced wallet:', wallet.id);
  } catch (e) {
    console.error('[Sync] Auto-sync wallet error:', e);
  }
}
