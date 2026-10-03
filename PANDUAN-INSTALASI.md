# PANDUAN INSTALASI — SIM-SPPD Desa Puspahiang

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek Baru** → rename `Code.gs` jadi `Kode` → paste seluruh isi `Kode.gs`.
2. Pilih fungsi **setupAppEnvironment** → ▶ Run **SEKALI SAJA** → izinkan akses Drive & Sheets. Log harus menampilkan ✅ dan link database.
3. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** → Deploy → salin URL `/exec`.
4. Buka Google Sheet *Database SIM-SPPD* → tab `User_Akses` → **ganti email contoh** (admin@desa.id, dst.) dengan email asli staf. PIN awal semua akun: `123456`.
5. Ganti PIN: di editor jalankan `aturPin('email@anda','PIN-BARU')` (edit sementara lewat fungsi pembungkus, atau panggil dari Debug).
6. Setiap Kode.gs diubah → **Deploy → Manage deployments → Edit → New version**.

## B. Frontend (GitHub Pages)
1. Ekstrak `sim-sppd-frontend.zip`. Hasilnya folder **`sim-sppd`** — **inilah folder yang di-`git init`** (bukan folder di atasnya).
2. Buka `sim-sppd/js/config.js`, ganti `ISI_URL_EXEC_DI_SINI` dengan URL `/exec` dari langkah A3.
3. Buka folder `sim-sppd` di File Explorer → klik address bar → ketik `powershell` → Enter. Jalankan `dir`: **wajib terlihat `index.html`, `css`, `js`**. Jika tidak, Anda di folder yang salah — jangan lanjut.
4. Pasang Git (https://git-scm.com/download/win), lalu sekali saja:
   ```
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github.com"
   ```
5. Di github.com: **+ → New repository**, nama `sim-sppd`, **Public**, jangan centang README. 
6. Dari PowerShell di folder `sim-sppd` (satu per satu):
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/sim-sppd.git
   git push -u origin main
   ```
   Password = **Personal Access Token** (github.com/settings/tokens → *classic* → centang `repo`). Layar kosong saat paste token itu normal.
7. Repo → **Settings → Pages** → Deploy from a branch → `main` / `(root)` → Save → centang **Enforce HTTPS**. Situs: `https://USERNAME.github.io/sim-sppd/`.
8. **Update/redeploy**: `git add .` → `git commit -m "pesan"` → `git push`, lalu Ctrl+Shift+R.

## C. Troubleshooting
| Gejala | Solusi |
|---|---|
| 404 di GitHub Pages | `index.html` tidak di root repo — ulangi dari folder `sim-sppd` (`git push -u origin main --force`) |
| Tampil tanpa styling | Folder `css/` & `js/` tidak ikut — jangan upload lewat web GitHub, gunakan git |
| "Gagal terhubung ke server" | `GAS_URL` belum diisi / deployment belum "Anyone" / belum New version |
| "Email atau PIN salah" | Cek tab `User_Akses`; ubah PIN dengan `aturPin` |

## D. UPDATE dari versi sebelumnya (v1 → v2)
**Backend (Apps Script)** — *JANGAN jalankan `setupAppEnvironment` lagi*
1. Buka proyek Apps Script lama → hapus isi `Kode.gs` → paste `Kode.gs` yang baru → Save.
2. Cek tab `User_Akses`: kolom `role` harus salah satu dari **Admin / Sekretaris / Kepala Desa / Pelaksana / Bendahara** (penyebab utama layar kosong sebelumnya).
3. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** URL `/exec` tetap sama.
4. Kolom baru (`laporan`, `status_laporan`) **dimigrasikan otomatis** saat data pertama disimpan — tidak perlu edit Sheet manual.
5. (Opsional, AI laporan) jalankan `setKunciAI('sk-ant-...')` sekali, lalu izinkan permission baru "koneksi ke layanan eksternal". Tanpa ini, tombol Generate Draft memakai template lokal.

**Frontend (GitHub Pages)** — folder kerja: `sim-sppd` (sama dengan sebelumnya)
1. Ekstrak ZIP baru, **timpa** isi folder `sim-sppd` lama (`index.html`, `css/`, `js/`). Pertahankan `js/config.js` lama jika `GAS_URL` sudah terisi, atau isi ulang URL-nya.
2. PowerShell di folder `sim-sppd` → `dir` (wajib terlihat `index.html`) lalu:
   ```
   git add .
   git commit -m "Update v2: laporan, master data, perbaikan layar kosong"
   git push
   ```
3. Tunggu 1–2 menit → buka situs → **Ctrl+Shift+R**. Jika masih kosong: F12 → Application → Local Storage → *Clear*, atau buka Incognito.

## E. UPDATE v3 — Format dokumen resmi + logo
**Backend:** paste `Kode.gs` baru → **Deploy → Manage deployments → ✏️ Edit → New version**. Kolom baru (NIK, golongan, waktu, mata anggaran, pengikut, no. SPD) dimigrasikan otomatis. Isi **NIK** aparatur lewat menu *Master Data* (isi NIPD yang sama → data diperbarui, bukan duplikat).
**Frontend:** ekstrak ZIP → salin **`index.html`, folder `css`, `js` (termasuk `desa.js` & `docs.js` baru), dan folder `img`** ke folder `sim-sppd`. File `js/config.js` Anda **tidak perlu ditimpa**. Lalu di PowerShell (folder `sim-sppd`):
```
git add .
git commit -m "Update v3: format ST, SPPD, laporan, tanda terima + logo"
git push
```
Tunggu 1–2 menit → Ctrl+Shift+R.
**Logo:** dimuat dari Google Drive — file harus dibagikan *"Siapa saja yang memiliki link"*. Jika tidak tampil, simpan logo sebagai `img/logo.png` lalu push ulang. Nama pejabat/NIPD tanda tangan ada di `js/desa.js`.

## F. UPDATE v4 — Cetak SPPD tidak terpotong
Backend **tidak berubah**. Salin `index.html`, `css/style.css`, `js/app.js`, `js/docs.js` ke folder `sim-sppd`, lalu `git add .` → `git commit -m "Update v4: cetak tidak terpotong, pengikut opsional"` → `git push` → Ctrl+Shift+R.
Saat dialog cetak: pilih **Ukuran kertas A4**, **Skala 100%/Default**, dan **matikan "Header dan footer"** agar hasil PDF rapi 2 halaman (depan–belakang).

## G. UPDATE v5 — Upload foto laporan & bukti biaya ke Google Drive
**Backend:** paste `Kode.gs` baru → **Deploy → Manage deployments → ✏️ Edit → New version**. Lalu di editor jalankan fungsi **`siapkanPenyimpanan`** ▶ (sekali) dan buka **Execution log** — akan tampil link 📁 Master Penyimpanan, 📂 Uploads, dan 📄 Database. Folder ini ada di **Google Drive akun yang men-deploy Apps Script** (My Drive → `SIM-SPPD-Archive`, atau `SIM-SPPD Master Penyimpanan` bila dibuat ulang). Setelah update, link yang sama juga tampil di menu **Master Data** (login Admin).
**Frontend:** salin `css/style.css` dan `js/app.js` ke folder `sim-sppd` → `git add .` → `git commit -m "Update v5: upload Drive"` → `git push` → Ctrl+Shift+R.
**Catatan:** foto laporan hanya tampil di dokumen cetak bila file dibagikan "siapa saja yang memiliki link". Jika admin Google Workspace Anda memblokir berbagi publik, aplikasi memberi peringatan dan foto tidak muncul di cetak.

## H. UPDATE v6 — Tanda Terima otomatis + spasi tanda tangan
Backend **tidak berubah**. Salin `css/style.css`, `js/app.js`, `js/docs.js` ke folder `sim-sppd` → `git add .` → `git commit -m "Update v6: tanda terima otomatis"` → `git push` → Ctrl+Shift+R.
Menu baru **Tanda Terima** (Bendahara, Sekretaris, Admin): filter tanggal bayar → centang penerima berstatus Lunas → **Buat Tanda Terima** → Cetak. Saat mencetak pilih **A4 Landscape** bila browser tidak otomatis memilihnya.

## I. UPDATE v7 — Format lembar kedua SPPD sesuai referensi
Backend **tidak berubah**. Salin `css/style.css` dan `js/docs.js` ke folder `sim-sppd` → `git add .` → `git commit -m "Update v7: format lembar 2 SPPD"` → `git push` → Ctrl+Shift+R.

## J. UPDATE v8 — Pengikut di semua dokumen + tanggal Tanda Terima
**Backend berubah:** paste `Kode.gs` baru → **Deploy → Manage deployments → ✏️ Edit → New version** (kolom `rincian` ditambahkan otomatis).
**Frontend:** salin `css/style.css`, `js/app.js`, `js/docs.js` ke folder `sim-sppd` → `git add .` → `git commit -m "Update v8: pengikut + tanggal tanda terima"` → `git push` → Ctrl+Shift+R.
**Cara pakai:** di form pengajuan centang pengikut dari daftar aparatur (atau ketik manual). Estimasi dihitung per orang. Saat mengisi biaya, tiap orang punya kolom jumlah sendiri. Pengajuan lama tanpa pengikut tidak terpengaruh.

## K. UPDATE v9 — Jumlah Tanda Terima per orang
Backend **tidak berubah**. Salin `js/app.js` dan `js/docs.js` ke folder `sim-sppd` → `git add .` → `git commit -m "Update v9: jumlah tanda terima per orang"` → `git push` → Ctrl+Shift+R.
Data lama yang realisasinya tersimpan sebagai satu total otomatis dibagi rata per orang saat dicetak. Untuk angka berbeda per orang, isi ulang lewat dialog *Isi Biaya* (status **Revisi**) pada pengajuan baru.

## L. UPDATE v10 — Tanggal lunas bayar + pengikut untuk Pelaksana
**WAJIB (backend):** paste `Kode.gs` terbaru → **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Jika backend belum diperbarui, aplikasi menampilkan banner merah di atas halaman, daftar centang pengikut **tidak muncul untuk Pelaksana**, dan rincian biaya per orang tidak tersimpan (jumlah menumpuk pada satu orang).
**Frontend:** salin `css/style.css`, `js/app.js`, `js/docs.js` → `git add .` → `git commit -m "Update v10"` → `git push` → Ctrl+Shift+R.
**Tanggal Lunas Bayar:** bawaan = tanggal kembali (sama dengan tanggal terbit surat). Bendahara dapat mengisinya saat *Setujui Biaya*, dan mengubahnya kapan saja di menu **Tanda Terima** (kolom *Tgl Lunas Bayar*).
