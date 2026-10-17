// ===== UangKu v3 — tab nav, donut, count-up, swipe hapus, grup tanggal, aksen warna =====
// Saldo boleh MINUS. Data di localStorage; update file tidak menghapus data.
const KEY_TX = 'uangku_transaksi_v1';
const KEY_W = 'uangku_dompet_v1';
const KEY_THEME = 'uangku_theme_v1';
const KEY_ACCENT = 'uangku_accent_v1';

const $ = (id) => document.getElementById(id);
const fmtRp = (n) => (n < 0 ? '−Rp ' : 'Rp ') + Math.abs(Number(n)).toLocaleString('id-ID');
const fmtShort = (n) => {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M';
  if (a >= 1e6) return (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (a >= 1e3) return (n / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
  return String(n);
};

const TIPE_LABEL = { bank: 'Bank', emoney: 'E-Money', cash: 'Cash' };
const BAYAR_LABEL = { cash: 'Cash', debit: 'Debit', qris: 'QRIS' };
const ICON_HURUF = { bank: 'B', kartu: 'K', tunai: 'T', digital: 'D' };

// ---------- storage ----------
function loadTx() {
  try { const a = JSON.parse(localStorage.getItem(KEY_TX)); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function saveTx(a) { localStorage.setItem(KEY_TX, JSON.stringify(a)); }
function loadWallets() {
  try { const a = JSON.parse(localStorage.getItem(KEY_W)); return Array.isArray(a) ? a : null; }
  catch { return null; }
}
function saveWallets(a) { localStorage.setItem(KEY_W, JSON.stringify(a)); }

function migrateIfNeeded() {
  let w = loadWallets();
  if (w !== null) {
    // lengkapi dompet lama dengan ikon & warna default
    let changed = false;
    w.forEach((d) => {
      if (!d.warna) { d.warna = '#4f46e5'; changed = true; }
      if (!d.icon) { d.icon = 'auto'; changed = true; }
    });
    if (changed) saveWallets(w);
    return w;
  }
  const tx = loadTx();
  let total = 0;
  tx.forEach((t) => { total += t.jenis === 'masuk' ? t.nominal : -t.nominal; });
  w = [{ id: 'w' + Date.now(), nama: 'Cash', tipe: 'cash', saldo: total, icon: 'auto', warna: '#4f46e5' }];
  tx.forEach((t) => { t.walletId = w[0].id; t.walletName = w[0].nama; t.bayar = t.bayar || 'cash'; });
  saveWallets(w); saveTx(tx);
  return w;
}

function walletHuruf(d) {
  if (d.icon && d.icon !== 'auto') return ICON_HURUF[d.icon] || d.nama.charAt(0).toUpperCase();
  return d.nama.charAt(0).toUpperCase();
}

// ---------- navigasi tab ----------
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    $(btn.dataset.page).classList.add('active');
    window.scrollTo({ top: 0 });
    if (btn.dataset.page === 'page-statistik') renderChart7d();
  });
});

// ---------- tema & aksen ----------
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const meta = $('meta-theme');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0a0f1e' : '#eef2f7');
  try { localStorage.setItem(KEY_THEME, t); } catch {}
}
function applyAccent(a) {
  document.documentElement.setAttribute('data-accent', a);
  try { localStorage.setItem(KEY_ACCENT, a); } catch {}
  document.querySelectorAll('#accent-row .accent-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.a === a));
}
(function initThemeAccent() {
  let t = null, a = null;
  try { t = localStorage.getItem(KEY_THEME); a = localStorage.getItem(KEY_ACCENT); } catch {}
  if (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
  applyTheme(t === 'dark' ? 'dark' : 'light');
  applyAccent(a || 'ungu');
})();
$('btn-theme').addEventListener('click', () => {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  renderChart7d();
});
document.querySelectorAll('#accent-row .accent-btn').forEach((b) =>
  b.addEventListener('click', () => applyAccent(b.dataset.a)));

// ---------- animasi angka saldo (count-up) ----------
let saldoAnim = null;
function countUp(el, target) {
  const from = el._val ?? 0;
  el._val = target;
  if (saldoAnim) cancelAnimationFrame(saldoAnim);
  if (from === target) { el.textContent = fmtRp(target); return; }
  const t0 = performance.now(), dur = 700;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmtRp(Math.round(from + (target - from) * e));
    if (p < 1) saldoAnim = requestAnimationFrame(step);
  };
  saldoAnim = requestAnimationFrame(step);
}

// ---------- donut porsi pengeluaran 7 hari ----------
function renderDonut(totM, totK) {
  const fg = $('donut-fg');
  if (!fg) return;
  const C = 163.3; // 2*pi*26
  const tot = totM + totK;
  const pct = tot > 0 ? totK / tot : 0;
  requestAnimationFrame(() => { fg.style.strokeDashoffset = C * (1 - pct); });
  $('donut-pct').textContent = Math.round(pct * 100) + '%';
}

// ---------- render utama ----------
function render() {
  const wallets = migrateIfNeeded();
  const tx = loadTx();
  let masuk = 0, keluar = 0;

  // --- dompet (tab Dompet) ---
  const wl = $('dompet-list');
  wl.innerHTML = '';
  wallets.forEach((d) => {
    const row = document.createElement('div');
    row.className = 'wallet-item';
    row.innerHTML =
      `<div class="wallet-icon" style="background:linear-gradient(140deg, ${d.warna || '#4f46e5'}, ${d.warna || '#4f46e5'}cc)">${walletHuruf(d)}</div>` +
      `<div class="wallet-info"><p class="wallet-name"></p><p class="wallet-type">${TIPE_LABEL[d.tipe] || d.tipe}</p></div>` +
      `<div><p class="wallet-balance${d.saldo < 0 ? ' negative' : ''}">${fmtRp(d.saldo)}</p>` +
      `${d.saldo < 0 ? '<span class="wallet-minus-tag">minus</span>' : ''}</div>` +
      `<button class="wallet-del" data-id="${d.id}" title="Hapus dompet">×</button>`;
    row.querySelector('.wallet-name').textContent = d.nama;
    wl.appendChild(row);
  });
  $('dompet-kosong').style.display = wallets.length ? 'none' : 'block';
  $('dompet-count').textContent = wallets.length + ' dompet';

  wl.querySelectorAll('.wallet-del').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = wallets.find((x) => x.id === btn.dataset.id);
      if (!d) return;
      if (!confirm(`Hapus dompet "${d.nama}"? Riwayat transaksinya tetap tersimpan.`)) return;
      saveWallets(wallets.filter((x) => x.id !== d.id));
      
      // Sync deletion to cloud (background)
      if (typeof supabase !== 'undefined' && supabase) {
        supabase.from('wallets').delete().eq('id', d.id).then(() => {
          console.log('[Sync] Wallet deleted from cloud:', d.id);
        });
      }
      
      render();
    });
  });

  // --- ringkasan dompet (tab Statistik) ---
  const sd = $('stat-dompet');
  if (sd) {
    sd.innerHTML = '';
    [...wallets].sort((a, b) => b.saldo - a.saldo).forEach((d) => {
      const row = document.createElement('div');
      row.className = 'wallet-item';
      row.innerHTML =
        `<div class="wallet-icon" style="background:linear-gradient(140deg, ${d.warna || '#4f46e5'}, ${d.warna || '#4f46e5'}cc)">${walletHuruf(d)}</div>` +
        `<div class="wallet-info"><p class="wallet-name"></p><p class="wallet-type">${TIPE_LABEL[d.tipe] || d.tipe}</p></div>` +
        `<p class="wallet-balance${d.saldo < 0 ? ' negative' : ''}">${fmtRp(d.saldo)}</p>`;
      row.querySelector('.wallet-name').textContent = d.nama;
      sd.appendChild(row);
    });
  }

  // --- dropdown dompet di form ---
  const sel = $('in-dompet');
  const prev = sel.value;
  sel.innerHTML = '';
  if (!wallets.length) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = '— tambah dompet dulu —';
    sel.appendChild(o);
  }
  wallets.forEach((d) => {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = `${d.nama} (${fmtRp(d.saldo)})`;
    sel.appendChild(o);
  });
  if (prev && wallets.some((d) => d.id === prev)) sel.value = prev;

  // --- riwayat dikelompokkan per tanggal ---
  const list = $('riwayat');
  list.innerHTML = '';
  const groups = {};
  const order = [];
  [...tx].reverse().forEach((t) => {
    if (t.jenis === 'masuk') masuk += t.nominal; else keluar += t.nominal;
    const k = t.ts ? dayKey(t.ts) : 'lama';
    if (!groups[k]) { groups[k] = { items: [], masuk: 0, keluar: 0 }; order.push(k); }
    groups[k].items.push(t);
    if (t.jenis === 'masuk') groups[k].masuk += t.nominal; else groups[k].keluar += t.nominal;
  });
  order.forEach((k) => {
    const g = groups[k];
    const d = k === 'lama' ? null : new Date(k + 'T12:00:00');
    const label = k === 'lama' ? 'Sebelumnya'
      : isToday(d) ? 'Hari Ini'
      : isYesterday(d) ? 'Kemarin'
      : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    const bersih = g.masuk - g.keluar;
    const h = document.createElement('p');
    h.className = 'day-group-label';
    h.innerHTML = `<span></span><span class="day-sub">+${fmtShort(g.masuk)} · −${fmtShort(g.keluar)}</span>`;
    h.querySelector('span').textContent = label;
    list.appendChild(h);
    g.items.forEach((t) => list.appendChild(txRow(t)));
  });

  // --- ringkasan (total boleh minus) + count-up + donut ---
  const total = wallets.reduce((s, d) => s + d.saldo, 0);
  const totalEl = $('total-saldo');
  totalEl.classList.toggle('negative', total < 0);
  countUp(totalEl, total);
  $('total-masuk').textContent = fmtRp(masuk);
  $('total-keluar').textContent = fmtRp(keluar);
  const last7 = sumLast7(tx);
  renderDonut(last7.m, last7.k);
  $('riwayat-kosong').style.display = tx.length ? 'none' : 'block';

  renderChart7d();
  refreshBackupInfo();
}

function txRow(t) {
  const wrap = document.createElement('div');
  wrap.className = 'tx-swipe';
  const inner = document.createElement('div');
  inner.className = 'tx-swipe-inner';
  const row = document.createElement('div');
  row.className = 'tx-item';
  const sign = t.jenis === 'masuk' ? '+' : '−';
  const bayarCls = t.bayar ? ` bayar-${t.bayar}` : '';
  const bayarTxt = BAYAR_LABEL[t.bayar] || '';
  row.innerHTML =
    `<div class="tx-sign ${t.jenis}">${t.jenis === 'masuk' ? '+' : '−'}</div>` +
    `<div class="tx-info"><p class="tx-ket"></p><p class="tx-date">${t.tanggal || ''}</p>` +
    `<div class="tx-meta">${t.walletName ? `<span class="tx-badge"></span>` : ''}${bayarTxt ? `<span class="tx-badge${bayarCls}">${bayarTxt}</span>` : ''}</div></div>` +
    `<p class="tx-nominal ${t.jenis}">${sign} ${fmtRp(t.nominal).replace('−Rp ', 'Rp ')}</p>`;
  row.querySelector('.tx-ket').textContent = t.keterangan || '(tanpa keterangan)';
  if (t.walletName) row.querySelector('.tx-badge').textContent = t.walletName;
  const del = document.createElement('button');
  del.className = 'tx-del';
  del.textContent = 'Hapus';
  del.addEventListener('click', () => {
    if (!confirm(`Hapus "${t.keterangan}" (${fmtRp(t.nominal)})? Saldo dompet ikut dikoreksi.`)) return;
    // koreksi saldo dompet (kembalikan efek transaksi)
    const wallets = loadWallets() || [];
    const d = wallets.find((x) => x.id === t.walletId);
    if (d) {
      d.saldo += t.jenis === 'masuk' ? -t.nominal : t.nominal;
      saveWallets(wallets);
      
      // Sync wallet update to cloud
      if (typeof autoSyncWallet === 'function') {
        autoSyncWallet(d);
      }
    }
    saveTx(loadTx().filter((x) => x.id !== t.id));
    
    // Sync deletion to cloud (background)
    if (typeof supabase !== 'undefined' && supabase) {
      supabase.from('transactions').delete().eq('id', t.id.toString()).then(() => {
        console.log('[Sync] Transaction deleted from cloud:', t.id);
      });
    }
    
    render();
  });
  inner.appendChild(row);
  inner.appendChild(del);
  wrap.appendChild(inner);
  // swipe kiri: sentuh + seret
  let sx = null;
  inner.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  inner.addEventListener('touchmove', (e) => {
    if (sx === null) return;
    const dx = e.touches[0].clientX - sx;
    inner.style.transform = dx < 0 ? `translateX(${Math.max(dx, -72)}px)` : 'translateX(0)';
  }, { passive: true });
  inner.addEventListener('touchend', () => {
    const m = inner.style.transform.match(/(-?\d+)/);
    const open = m && parseInt(m[1], 10) < -40;
    inner.style.transform = open ? 'translateX(-72px)' : 'translateX(0)';
    sx = null;
  });
  return wrap;
}

function isToday(d) { const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }
function isYesterday(d) { const y = new Date(); y.setDate(y.getDate() - 1); return d.getFullYear() === y.getFullYear() && d.getMonth() === y.getMonth() && d.getDate() === y.getDate(); }
function sumLast7(tx) {
  const cutoff = Date.now() - 7 * 864e5;
  let m = 0, k = 0;
  tx.forEach((t) => {
    const ts = t.ts || Date.now();
    if (ts < cutoff) return;
    if (t.jenis === 'masuk') m += t.nominal; else k += t.nominal;
  });
  return { m, k };
}

// ---------- tambah dompet ----------
let warnaBaru = '#4f46e5';
document.querySelectorAll('#w-warna .sw').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('#w-warna .sw').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    warnaBaru = b.dataset.c;
  }));
$('btn-dompet').addEventListener('click', () => {
  const nama = $('w-nama').value.trim();
  const tipe = $('w-tipe').value;
  const icon = $('w-icon').value;
  const saldoRaw = $('w-saldo').value.trim();
  const saldo = saldoRaw === '' ? 0 : Math.floor(Number(saldoRaw));
  if (!nama) { $('w-nama').focus(); return; }
  if (!isFinite(saldo)) { $('w-saldo').focus(); return; }
  const wallets = migrateIfNeeded();
  if (wallets.some((d) => d.nama.toLowerCase() === nama.toLowerCase())) {
    alert('Dompet dengan nama itu sudah ada.');
    return;
  }
  const newWallet = { id: 'w' + Date.now(), nama, tipe, saldo, icon, warna: warnaBaru };
  wallets.push(newWallet);
  saveWallets(wallets);
  
  // Auto-sync ke cloud (background)
  if (typeof autoSyncWallet === 'function') {
    autoSyncWallet(newWallet);
  }
  
  $('w-nama').value = ''; $('w-saldo').value = '';
  render();
});

// ---------- simpan transaksi + efek sukses ----------
let toastTimer = null;
function suksesFeedback() {
  const btn = $('btn-simpan');
  btn.classList.add('success');
  btn.querySelector('.btn-label').textContent = 'Tersimpan ✓';
  try { if (navigator.vibrate) navigator.vibrate(15); } catch {}
  const toast = $('save-toast');
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    btn.classList.remove('success');
    btn.querySelector('.btn-label').textContent = 'Simpan Transaksi';
  }, 1600);
}
$('btn-simpan').addEventListener('click', () => {
  const nominal = Math.floor(Number($('in-nominal').value));
  const jenis = $('in-jenis').value;
  const walletId = $('in-dompet').value;
  const bayar = $('in-bayar').value;
  const keterangan = $('in-ket').value.trim();

  if (!nominal || nominal <= 0) { $('in-nominal').focus(); return; }
  const wallets = migrateIfNeeded();
  const dompet = wallets.find((d) => d.id === walletId);
  if (!dompet) { alert('Pilih / tambahkan dompet dulu.'); return; }

  dompet.saldo += jenis === 'masuk' ? nominal : -nominal;
  saveWallets(wallets);

  const tx = loadTx();
  const newTx = {
    id: Date.now(),
    ts: Date.now(),
    nominal, jenis, bayar,
    walletId: dompet.id, walletName: dompet.nama,
    keterangan: keterangan || (jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'),
    tanggal: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  };
  tx.push(newTx);
  saveTx(tx);
  
  // Auto-sync ke cloud (background)
  if (typeof autoSyncTransaction === 'function') {
    autoSyncTransaction(newTx);
  }
  if (typeof autoSyncWallet === 'function') {
    autoSyncWallet(dompet);
  }
  
  render();
  suksesFeedback();

  $('in-nominal').value = ''; $('in-ket').value = '';
  $('in-nominal').focus();
});

$('in-nominal').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-simpan').click(); });
$('in-ket').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btn-simpan').click(); });

$('btn-hapus').addEventListener('click', () => {
  if (!loadTx().length) return;
  if (confirm('Hapus semua riwayat transaksi? (Saldo dompet tidak berubah)')) {
    saveTx([]);
    render();
  }
});

// ---------- segmented controls ----------
function segInit(segId, selectId) {
  const seg = $(segId);
  const sel = $(selectId);
  seg.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      seg.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      sel.value = btn.dataset.val;
    });
  });
}
segInit('seg-jenis', 'in-jenis');
segInit('seg-bayar', 'in-bayar');

// ---------- grafik 7 hari ----------
function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function renderChart7d() {
  const cv = $('chart-7d');
  if (!cv) return;
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ key: dayKey(d.getTime()), label: d.toLocaleDateString('id-ID', { weekday: 'short' }), masuk: 0, keluar: 0 });
  }
  const map = Object.fromEntries(days.map((d) => [d.key, d]));
  const todayKey = days[6].key;
  loadTx().forEach((t) => {
    const k = t.ts ? dayKey(t.ts) : todayKey;
    if (!map[k]) return;
    if (t.jenis === 'masuk') map[k].masuk += t.nominal; else map[k].keluar += t.nominal;
  });

  const totM = days.reduce((s, d) => s + d.masuk, 0);
  const totK = days.reduce((s, d) => s + d.keluar, 0);
  $('stat-7d-masuk').textContent = fmtRp(totM);
  $('stat-7d-keluar').textContent = fmtRp(totK);
  const bersihEl = $('stat-7d-bersih');
  bersihEl.textContent = fmtRp(totM - totK);
  bersihEl.style.color = (totM - totK) < 0 ? 'var(--red)' : 'var(--ink)';

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4f46e5';
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth || 360, H = 190;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const grid = dark ? 'rgba(148,163,184,.18)' : 'rgba(100,116,139,.18)';
  const lbl = dark ? '#9aa7bd' : '#64748b';
  const maxV = Math.max(1, ...days.flatMap((d) => [d.masuk, d.keluar]));
  const padL = 8, padB = 22, padT = 10;
  const plotH = H - padB - padT;
  ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (let g = 0; g <= 3; g++) {
    const y = padT + (plotH * g) / 3;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padL, y); ctx.stroke();
  }
  const slot = (W - padL * 2) / days.length;
  const bw = Math.min(16, (slot - 14) / 2);
  days.forEach((d, i) => {
    const cx = padL + slot * i + slot / 2;
    const hM = (d.masuk / maxV) * plotH, hK = (d.keluar / maxV) * plotH;
    const y0 = padT + plotH;
    ctx.fillStyle = dark ? '#34d399' : '#059669';
    roundBar(ctx, cx - bw - 1, y0 - hM, bw, Math.max(hM, d.masuk > 0 ? 3 : 0));
    ctx.fillStyle = dark ? '#fb7185' : '#e11d48';
    roundBar(ctx, cx + 1, y0 - hK, bw, Math.max(hK, d.keluar > 0 ? 3 : 0));
    ctx.fillStyle = lbl;
    ctx.font = '700 10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, cx, H - 7);
  });
  void accent;
}
function roundBar(ctx, x, y, w, h) {
  if (h <= 0) return;
  const r = Math.min(4, w / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

// ---------- backup ----------
function refreshBackupInfo() {
  const el = $('backup-info');
  if (!el) return;
  const tx = loadTx();
  const w = loadWallets() || [];
  el.textContent = tx.length || w.length
    ? `${tx.length} transaksi · ${w.length} dompet tersimpan di HP ini.`
    : 'Belum ada data di HP ini.';
}
$('btn-export').addEventListener('click', () => {
  const data = {
    app: 'UangKu', version: 2, exportedAt: new Date().toISOString(),
    wallets: loadWallets() || [], transaksi: loadTx(),
    theme: document.documentElement.getAttribute('data-theme') || 'light',
    accent: document.documentElement.getAttribute('data-accent') || 'ungu',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'uangku-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
});
$('btn-import').addEventListener('click', () => $('file-import').click());
$('file-import').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const data = JSON.parse(rd.result);
      if (!Array.isArray(data.transaksi) || !Array.isArray(data.wallets)) throw new Error('format salah');
      if (!confirm(`Pulihkan backup${data.exportedAt ? ' (' + new Date(data.exportedAt).toLocaleDateString('id-ID') + ')' : ''} berisi ${data.transaksi.length} transaksi & ${data.wallets.length} dompet? Data di HP ini akan diganti.`)) return;
      saveWallets(data.wallets);
      saveTx(data.transaksi);
      if (data.theme) applyTheme(data.theme === 'dark' ? 'dark' : 'light');
      if (data.accent) applyAccent(data.accent);
      render();
      alert('Backup berhasil dipulihkan.');
    } catch { alert('File backup tidak valid.'); }
    e.target.value = '';
  };
  rd.readAsText(f);
});

window.addEventListener('resize', () => renderChart7d());

// ---------- kunci zoom iOS (gesture + double-tap) ----------
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
let _lastTap = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - _lastTap < 300) e.preventDefault();
  _lastTap = now;
}, { passive: false });

render();
