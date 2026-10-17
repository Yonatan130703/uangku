# Setup Supabase untuk UangKu - Panduan Lengkap

## Step 1: Buat Akun Supabase (5 menit)

### 1.1 Buka Website Supabase
- Buka browser, kunjungi: **https://supabase.com**
- Klik tombol **"Start your project"** atau **"Sign Up"**

### 1.2 Daftar dengan GitHub (Recommended)
- Klik **"Continue with GitHub"**
- Login dengan akun GitHub kamu
- Authorize Supabase (klik **"Authorize"**)

**ATAU** pakai Email:
- Masukkan email kamu
- Masukkan password (minimal 8 karakter)
- Klik **"Sign Up"**
- Buka email, klik link verifikasi

---

## Step 2: Buat Project Baru (3 menit)

### 2.1 Create New Project
- Setelah login, klik **"New project"**
- Isi form:
  - **Name**: `UangKu` (atau nama bebas)
  - **Database Password**: Buat password kuat (SIMPAN PASSWORD INI!)
    - Contoh: `UangKu2026!Secure`
    - **PENTING**: Copy dan simpan di Notepad/Notes
  - **Region**: Pilih **"Southeast Asia (Singapore)"** (paling dekat dari Indonesia)
  - **Pricing Plan**: Pilih **"Free"** (sudah ter-select)

### 2.2 Tunggu Project Setup
- Klik **"Create new project"**
- Tunggu 1-2 menit (ada loading spinner)
- Project akan otomatis terbuka

---

## Step 3: Setup Database (5 menit)

### 3.1 Buka SQL Editor
- Di sidebar kiri, klik ikon **"SQL Editor"** (ikon </> atau database)
- Klik **"+ New query"**

### 3.2 Copy-Paste SQL Ini

```sql
-- Tabel Wallets (Dompet)
CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('bank', 'emoney', 'cash')),
  saldo BIGINT DEFAULT 0,
  icon TEXT DEFAULT 'auto',
  warna TEXT DEFAULT '#4f46e5',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Transactions (Transaksi)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  wallet_name TEXT,
  nominal BIGINT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  bayar TEXT DEFAULT 'cash',
  keterangan TEXT,
  tanggal TEXT,
  ts BIGINT NOT NULL,
  synced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa (cepat saat query banyak data)
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_ts ON transactions(ts DESC);

-- Row Level Security (RLS) - User cuma bisa akses data sendiri
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat/edit data sendiri
CREATE POLICY "Users can manage own wallets"
  ON wallets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3.3 Jalankan SQL
- Paste SQL di atas ke editor
- Klik **"Run"** (tombol play ▶️ di kanan atas)
- Tunggu sampai muncul **"Success. No rows returned"**

---

## Step 4: Ambil API Keys (3 menit)

### 4.1 Buka Settings
- Di sidebar kiri bawah, klik ikon **⚙️ Settings**
- Klik **"API"** di menu

### 4.2 Copy Credentials Ini:

Kamu akan lihat 2 hal penting:

1. **Project URL**
   - Contoh: `https://abcdefghijklmnop.supabase.co`
   - Copy dan simpan

2. **API Keys** → Pilih tab **"anon public"**
   - Ada key panjang seperti: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Copy dan simpan

### 4.3 Simpan di File Ini

Buat file baru: `supabase-config.txt` di folder yang sama dengan index.html

```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...panjang banget...
```

**GANTI dengan URL dan KEY kamu yang asli!**

---

## Step 5: Test Database (Opsional - 2 menit)

### 5.1 Buka Table Editor
- Di sidebar kiri, klik **"Table Editor"**
- Kamu akan lihat 2 tabel: `wallets` dan `transactions`
- Klik salah satu → lihat kolom-kolomnya (harusnya kosong dulu)

### 5.2 Cek Authentication
- Di sidebar kiri, klik **"Authentication"**
- Tab **"Users"** → harusnya masih kosong (belum ada user)
- Nanti setelah daftar pertama kali di app, akan muncul di sini

---

## ✅ Setup Selesai!

Kalau sudah sampai sini, berarti Supabase sudah siap!

### Checklist:
- ✅ Akun Supabase dibuat
- ✅ Project baru dibuat
- ✅ Database (2 tabel) dibuat via SQL
- ✅ API Keys disimpan di `supabase-config.txt`

### Yang Harus Kamu Berikan ke Saya:

Kirim isi file `supabase-config.txt` (URL dan ANON_KEY) ke chat ini.

**CATATAN KEAMANAN:**
- ANON_KEY itu public key, boleh di-share (sudah ada RLS protection)
- Jangan share DATABASE_PASSWORD atau SERVICE_ROLE_KEY (secret)

---

## Troubleshooting

### Masalah: SQL Error saat Run
- **Solusi**: Hapus semua query sebelumnya, paste ulang SQL dari Step 3.2, run lagi

### Masalah: Tidak muncul API Keys
- **Solusi**: Refresh page, atau logout → login lagi

### Masalah: Region Singapore tidak ada
- **Solusi**: Pilih region terdekat lainnya (Tokyo, Hong Kong, atau Mumbai)

---

## Next Step

Setelah selesai setup ini:
1. Kirim `supabase-config.txt` ke chat
2. Saya akan modifikasi app UangKu (tambah login + sync)
3. Kita test bareng

Selamat mencoba! 🚀
