# SP MTA - Surat Penawaran Harga CV. MULIA TEKHNIK ABADI

Aplikasi PWA (Progressive Web App) khusus Android & Web untuk membuat, mengelola, mencetak PDF A4 resmi, dan membagikan Surat Penawaran Harga milik **CV. MULIA TEKHNIK ABADI**.

---

## 🌟 Fitur Utama
1. **PWA Android Siap Pakai**: Dapat diinstal ke layar utama HP (Add to Home Screen) seperti aplikasi Android bawaan.
2. **Kop, Tanda Tangan & Stempel Resmi**: Upload gambar KOP, TTD, dan stempel yang tersimpan aman di perangkat (IndexedDB).
3. **Format Dokumen A4 Rapi & Standar**: Mengikuti tata letak formal resmi MTA (Nomor, Tanggal, Tujuan, Tabel Penawaran, Trade-In, Diskon, DPP, PPN, dan Total).
4. **Penomoran Surat Otomatis & Tersinkron**: Nomor surat otomatis berurutan (misal: `016/10/MTA/2026`) dan dapat diatur nomor awal di menu Pengaturan.
5. **AI Pembuat & Revisi Isi Surat (Chat & Voice)**:
   - Tombol **Generate AI** yang cepat, singkat, padat, dan jelas.
   - Fitur **Revisi Kalimat via Chat atau Voice (Mic)** untuk memperbaiki atau menyesuaikan kalimat pembuka & penutup langsung dengan suara atau ketikan.
   - Pilihan cepat (⚡ Lebih Singkat, ⏳ Berlaku 14 Hari, 🛡️ Garansi Resmi, 👔 Sangat Formal, 📍 Bebas Biaya Survei).
   - Tombol **Urungkan (Undo)** jika ingin membatalkan revisi AI.
6. **Auto-Save Draft Otomatis**: Jika pengguna tidak sengaja menekan tombol Back di HP atau menutup browser, data otomatis tersimpan sebagai **Draft** di Rekap Surat.
7. **Bagikan ke WhatsApp & Email**: Opsi langsung membagikan penawaran ke WhatsApp atau Email dengan file PDF terlampir.
8. **Fitur Bagi Kopi**: Tombol kopi di pojok kanan atas dengan nomor GoPay `08179015181` atas nama `jamhur`.

---

## 🚀 Panduan Upload ke GitHub

1. **Inisialisasi Git (jika belum)**:
   ```bash
   git init
   git add .
   git commit -m "feat: SP MTA PWA lengkap dengan AI Voice & Chat Revision"
   ```

2. **Buat Repository Baru di GitHub**:
   - Buka [GitHub](https://github.com/new).
   - Beri nama repository (misal: `sp-mta`).
   - Jangan centang "Add a README file" karena proyek ini sudah memiliki README.

3. **Hubungkan dan Push ke GitHub**:
   ```bash
   git remote add origin https://github.com/USERNAME/sp-mta.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Panduan Deploy ke Netlify

Proyek ini telah dilengkapi dengan konfigurasi otomatis `netlify.toml` dan serverless functions di folder `netlify/functions/`.

1. **Buka Netlify**:
   - Masuk ke [Netlify](https://app.netlify.com/).
   - Klik **"Add new site"** > **"Import an existing project"**.
   - Pilih **GitHub** dan pilih repository `sp-mta` yang baru di-upload.

2. **Pengaturan Build (Otomatis dari netlify.toml)**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

3. **Set Environment Variable di Netlify**:
   - Masuk ke **Site configuration** > **Environment variables**.
   - Tambahkan variabel:
     - Key: `GEMINI_API_KEY`
     - Value: `(Masukkan API Key Google Gemini Anda)`
   - Klik **Save**.

4. **Deploy**:
   - Klik **Deploy site**.
   - Netlify akan otomatis membangun SPA dan serverless functions (`generate-letter-content`, `revise-letter-content`, dan `ai-status`).

---

## 💻 Jalankan di Komputer Lokal

```bash
# 1. Install dependensi
npm install

# 2. Buat file .env dari .env.example
cp .env.example .env
# Isi GEMINI_API_KEY Anda di dalam file .env

# 3. Jalankan server lokal
npm run dev
```

Buka browser di `http://localhost:3000`.
