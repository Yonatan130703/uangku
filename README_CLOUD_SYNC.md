# UangKu v4 - Cloud Sync Edition

Aplikasi pencatat keuangan pribadi dengan fitur **sinkronisasi cloud** menggunakan Supabase.

## ✨ Fitur Baru

### 🔐 Login & Register
- Daftar akun dengan email & password
- Login untuk akses data dari mana saja
- Mode offline (tanpa login) tetap tersedia

### ☁️ Cloud Sync
- **Auto-sync** setiap kali simpan transaksi atau dompet
- Data tersimpan di cloud Supabase (gratis 500MB)
- Akses data dari perangkat berbeda (HP, tablet, laptop)
- Tetap bisa pakai **offline** - sync otomatis saat online

### 📤 Migration Helper
- Upload data localStorage lama ke cloud
- Pertama kali login: pilih upload atau skip data lokal

---

## 🚀 Cara Pakai

### 1. Buka Aplikasi
```
http://localhost:8082
atau
D:\Yonatan\PROJEK ELEKTRO SAYA\pencatat_keuangan\index.html
```

### 2. Pilihan Login

#### A. **Login/Register** (Sync ke Cloud)
1. Klik tab **"Daftar"** (untuk user baru)
2. Masukkan email & password (min. 6 karakter)
3. Klik **"Daftar"**
4. Login dengan email & password yang dibuat
5. Data akan otomatis sync ke cloud

#### B. **Mode Offline** (Lokal Saja)
1. Klik tombol **"Pakai Mode Offline"**
2. Langsung masuk tanpa login
3. Data hanya tersimpan di perangkat ini

---

## 📱 Cara Kerja Sync

### Auto-Sync
Setiap kali kamu:
- Simpan transaksi baru → auto-upload ke cloud
- Tambah dompet → auto-upload ke cloud
- Hapus transaksi/dompet → auto-delete dari cloud

### Manual Sync
Di tab **"Lainnya"**:
- Klik **"Sinkronkan Sekarang"** untuk force sync

### Offline → Online
- Catat transaksi saat offline → tersimpan lokal
- Internet kembali → buka app lagi → auto-sync

---

## 🔄 Migration Data Lama

Kalau kamu sudah pakai UangKu versi lama (localStorage):

1. Login pertama kali
2. Muncul popup: **"Data Lokal Terdeteksi"**
   - Jumlah transaksi & dompet ditampilkan
3. Pilih:
   - **"Upload ke Cloud"** → data lama diupload, tetap tersimpan
   - **"Lewati"** → data lama dihapus, mulai dari nol

---

## 🌐 Login di Perangkat Lain

### Scenario: Login di HP Baru

1. Buka UangKu di HP baru
2. Login dengan email & password yang sama
3. Data otomatis terdownload dari cloud
4. Semua transaksi & dompet langsung muncul

### Multi-Device
- Login di HP A: catat transaksi → sync ke cloud
- Login di HP B: buka app → transaksi dari HP A muncul
- **Sinkronisasi real-time** (selama online)

---

## 🔒 Keamanan

### Row Level Security (RLS)
- Setiap user cuma bisa lihat data sendiri
- Database sudah dikonfigurasi dengan RLS policy
- Tidak mungkin user A lihat data user B

### Password
- Password di-hash oleh Supabase (bcrypt)
- Tidak ada yang bisa baca password asli

### API Key
- `SUPABASE_ANON_KEY` adalah public key
- Aman dipakai di browser (RLS sudah protect)

---

## ⚙️ Tab Lainnya - Fitur Akun

### Akun & Sinkronisasi
- **Email**: tampilkan email yang login
- **Status**: Online/Offline
- **Sinkronkan Sekarang**: force sync manual
- **Keluar**: logout (data lokal tetap tersimpan)

### Logout
- Keluar dari akun
- Data lokal **tidak dihapus**
- Bisa login lagi nanti untuk sync

---

## 🐛 Troubleshooting

### 1. Tidak bisa login?
- Periksa email & password (case-sensitive)
- Pastikan password min. 6 karakter
- Cek koneksi internet

### 2. Data tidak sync?
- Cek status: **Online/Offline** di tab Lainnya
- Klik **"Sinkronkan Sekarang"**
- Lihat console browser (F12) untuk log sync

### 3. Lupa password?
- Reset password via Supabase dashboard
- Atau buat akun baru

### 4. Data hilang setelah login?
- Kemungkinan login dengan email berbeda
- Atau skip migration saat pertama login
- Cek Supabase dashboard: data masih ada di database

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (no framework)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Sync**: Supabase Realtime (WebSocket)
- **Storage**: localStorage (cache) + Supabase (cloud)
- **Auth**: Supabase Auth (email/password)

---

## 📊 Database Schema

### Table: `wallets`
```sql
- id (UUID)
- user_id (UUID) → auth.users
- nama (TEXT)
- tipe (TEXT): bank, emoney, cash
- saldo (BIGINT)
- icon (TEXT)
- warna (TEXT)
```

### Table: `transactions`
```sql
- id (UUID)
- user_id (UUID) → auth.users
- wallet_id (UUID) → wallets
- wallet_name (TEXT)
- nominal (BIGINT)
- jenis (TEXT): masuk, keluar
- bayar (TEXT): cash, debit, qris
- keterangan (TEXT)
- tanggal (TEXT)
- ts (BIGINT) - timestamp
```

---

## 🎉 Update Log

### v4.0 (17 Oktober 2026)
- ✅ Login & Register dengan Supabase Auth
- ✅ Cloud sync (auto & manual)
- ✅ Migration helper untuk data localStorage lama
- ✅ Multi-device support
- ✅ Offline mode tetap jalan
- ✅ Account info di tab Lainnya
- ✅ Logout feature

### v3.0 (Sebelumnya)
- Tab navigation
- Donut chart 7 hari
- Count-up animation
- Swipe to delete
- Grouped history by date
- Color accent themes

---

## 📞 Support

Ada masalah atau pertanyaan? 
- Lihat console browser (F12) untuk error log
- Screenshot error + kirim ke developer
- Check Supabase dashboard untuk data cloud

---

**UangKu v4 - Pencatat Keuangan dengan Cloud Sync**  
Dibuat untuk Yonatan - Oktober 2026
