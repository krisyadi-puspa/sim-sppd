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
