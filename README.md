# CuacaKita

**Tahu Cuacanya, Paham Dampaknya.**

Platform analisis dampak cuaca untuk Indonesia. Bukan aplikasi cuaca biasa:
CuacaKita menelusuri apa yang mungkin terjadi **setelah** hujan turun — ke
pertanian, peternakan, perkebunan, pasokan, perjalanan, lingkungan, sampai ke
kegiatan warga sehari-hari.

---

## Yang membuatnya berbeda

Aplikasi cuaca berhenti di angka milimeter. CuacaKita melanjutkannya menjadi
rantai dampak berjenjang, dengan **tingkat keyakinan yang menurun** semakin
jauh dari pengukuran:

```
CUACA → PERTANIAN → PASOKAN → HARGA → TRANSPORTASI → LINGKUNGAN → BENCANA → MASYARAKAT
 terukur   terukur    turunan  indikatif  terukur      terukur     terukur    turunan
```

Simpul "Harga" diberi label paling lemah dengan sengaja: harga pangan
dipengaruhi stok nasional, impor, kebijakan, dan biaya distribusi — cuaca
hanya salah satu faktornya. Menyembunyikan hal itu akan membuat platform ini
terdengar lebih pintar daripada yang sebenarnya.

---

## Sumber data

| Sumber | Peran | Kunci API | Catatan |
|---|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Mesin utama | **Tidak perlu** | Prakiraan per jam & harian, curah hujan, angin, kelembapan, tekanan, jarak pandang, indeks UV, elevasi titik, dan histori sampai 92 hari |
| [BMKG](https://bmkg.go.id) | Pembanding resmi | Tidak perlu | Prakiraan resmi pemerintah, ditampilkan berdampingan — bukan menggantikan |
| Harga komoditas | — | — | **Belum terhubung.** Simpul Harga hanya menunjukkan arah tekanan dari sisi cuaca |

Aplikasi ini **berjalan penuh tanpa satu pun variabel environment**. Tidak ada
kunci API yang perlu disiapkan sebelum deploy.

### Dua kendala BMKG yang menentukan arsitektur

Keduanya ditemukan lewat pengujian langsung, bukan dari dokumentasi:

1. **BMKG menolak permintaan tanpa header `Referer: https://www.bmkg.go.id/`.**
   Karena itu BMKG hanya dipanggil dari server; memanggilnya dari peramban
   akan selalu mendapat HTTP 403.
2. **BMKG hanya melayani tingkat `adm4` (desa/kelurahan).** Permintaan pada
   `adm1`, `adm2`, dan `adm3` ditolak. Karena itu tiap kota perlu satu
   kelurahan perwakilan, dan daftarnya dibangun oleh skrip yang
   **menguji setiap kode ke BMKG** sebelum menuliskannya — tidak ada kode
   karangan yang masuk ke repositori.

BMKG juga membatasi laju permintaan, sehingga responsnya di-cache satu jam dan
kegagalannya tidak pernah menjatuhkan halaman — panel BMKG sekadar
disembunyikan dengan keterangan.

---

## Mesin dampak

Enam sektor dinilai 0–100 (**makin tinggi makin besar dampaknya**) dengan
label Rendah / Sedang / Tinggi / Sangat Tinggi.

Setiap skor adalah **jumlah berbobot dari faktor yang dinormalkan**, dan tiap
faktor dikembalikan lengkap dengan nilai mentah, bobot, dan sumbangannya —
sehingga angka apa pun di layar bisa dibuka sampai ke asalnya lewat tombol
"Lihat dasar perhitungan".

### Pemicu versus kerentanan

Banjir dan longsor **tidak** menjumlahkan topografi sebagai faktor mandiri:

```
skor = (pemicu hujan) × (kerentanan wilayah)
```

Alasannya penting. Menjumlahkan elevasi sebagai faktor membuat daerah
pegunungan selalu tampak berisiko longsor walaupun kering — versi awal mesin
ini memberi Bandung skor longsor 45 dengan curah hujan 72 jam hanya 6,5 mm.
Dengan rumus pengali, hasilnya menjadi 0 saat kering, dan tetap tinggi saat
hujan ekstrem:

| Skenario | Pesisir (3 mdpl) | Dataran rendah (50 mdpl) | Pegunungan (900 mdpl) |
|---|---:|---:|---:|
| Tenang — banjir | 0 | 0 | 0 |
| Hujan ekstrem 3 hari — banjir | **65** | 53 | 26 |
| Tenang — longsor | 0 | 0 | 0 |
| Hujan ekstrem 3 hari — longsor | 24 | 24 | **59** |

Topografi memodulasi, bukan mendikte.

### Batasan yang harus disampaikan apa adanya

- Skor adalah **indikator analitis internal**, bukan peringatan dini resmi.
  Rujukan resmi tetap BMKG dan BPBD.
- **Elevasi dipakai sebagai pendekatan kasar kemiringan lahan.** Ini bukan
  data lereng, dan bukan pengganti peta rawan bencana.
- Ambang batas disusun dari klasifikasi curah hujan BMKG dan rentang
  kenyamanan ternak/tanaman yang lazim, **bukan dari model yang sudah
  tervalidasi lapangan**.
- Tidak ada angka yang dikarang. Bila sumber data gagal dihubungi, bagian itu
  dikosongkan dan diberi keterangan.

---

## Tanpa model bahasa

Seluruh analisis — skor, rantai dampak, dan ringkasan "Apa yang sedang
terjadi?" — **dihitung secara deterministik**, tidak dihasilkan model bahasa.
Konsekuensinya disengaja: jawabannya selalu sama untuk data yang sama, bisa
diperiksa ulang, dan tidak mungkin menyebut angka yang tidak ada di sistem.

Lapisan analisis tetap dibuat terpisah (`src/lib/impact/`), sehingga penyedia
lain bisa dipasang di kemudian hari tanpa membongkar yang lain.

---

## Arsitektur

```
src/
├── app/                      Halaman dan route API (Next.js App Router)
│   ├── page.tsx              Landing page
│   ├── dashboard/            Dashboard cuaca + dampak
│   ├── peta/                 Peta cuaca & risiko (Leaflet)
│   ├── histori/              Histori dan perbandingan antarperiode
│   └── api/cuaca/            Route API dengan validasi Zod
│
├── server/                   Hanya berjalan di server ("server-only")
│   ├── sources/
│   │   ├── open-meteo.ts     Adapter Open-Meteo (mesin utama)
│   │   └── bmkg.ts           Adapter BMKG (pembanding resmi)
│   ├── cuaca.ts              Orkestrasi satu halaman
│   ├── peta.ts               Data peta — 43 kota dalam SATU permintaan
│   └── histori.ts            Data historis + periode pembanding
│
├── lib/
│   ├── weather/              Bentuk data kanonik + pemetaan kode WMO
│   ├── impact/
│   │   ├── engine.ts         Enam sektor, bobot, dan skenario simulasi
│   │   ├── rantai.ts         Rantai dampak + tingkat keyakinan
│   │   └── insight.ts        Penyusun ringkasan deterministik
│   └── lokasi.ts             Daftar kota terverifikasi
│
├── components/               Komponen UI
└── data/wilayah.json         43 kota, tiap kode adm4 sudah diuji ke BMKG
```

Setiap adapter sumber data wajib menghasilkan bentuk kanonik di
`src/lib/weather/types.ts`. Seluruh aplikasi hanya bicara dengan tipe itu,
tidak pernah langsung dengan bentuk mentah milik penyedia — sehingga sumber
data dapat diganti tanpa menyentuh satu pun komponen.

---

## Visualisasi data

Palet grafik tidak dipilih berdasarkan selera, melainkan **divalidasi dengan
skrip** terhadap permukaan yang benar-benar dipakai (`#ffffff` terang,
`#0e1726` gelap): rentang kecerahan, ambang kroma, keterpisahan di bawah
simulasi buta warna, dan kontras terhadap latar.

- Suhu dan curah hujan **sengaja dipisah menjadi dua grafik**. Menumpuknya
  pada satu bidang dengan dua sumbu Y menciptakan keterkaitan yang tidak ada
  di datanya.
- Kategori nominal memakai **satu warna** untuk semua batang, bukan gradasi
  mengikuti nilai.
- **Setiap grafik punya kembaran tabel** (tombol di kanan atas), sehingga
  tidak ada nilai yang hanya bisa dibaca lewat warna.
- Warna tingkat risiko selalu berpasangan dengan **ikon dan label teks**.

---

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Tidak ada berkas `.env` yang perlu diisi.

### Skrip

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `node scripts/bangun-wilayah.mjs` | Membangun ulang `src/data/wilayah.json`, menguji tiap kode adm4 ke BMKG |
| `npx tsx scripts/uji-mesin.ts` | Menguji perilaku mesin dampak pada kondisi buatan |

---

## Deploy ke Vercel

1. Buat repositori baru di GitHub (jangan centang "Add a README").
2. Dari folder proyek ini:

   ```bash
   git remote add origin https://github.com/<akun>/<repo>.git
   git branch -M main
   git push -u origin main
   ```

3. Buka <https://vercel.com/new>, pilih repositori tersebut, lalu **Deploy**.
   Vercel mengenali Next.js secara otomatis.
4. **Tidak ada environment variable yang perlu diisi.**

Pengaturan bawaan sudah sesuai: `/` dan `/peta` dibangun statis dengan
revalidasi 15 menit (mengikuti irama pembaruan Open-Meteo), sedangkan
`/dashboard` dan `/histori` dirender saat diminta karena bergantung pada
parameter lokasi.

---

## Lisensi data dan atribusi

- Data cuaca: [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- Prakiraan resmi: [BMKG](https://bmkg.go.id)
- Ubin peta: Kontributor [OpenStreetMap](https://www.openstreetmap.org/copyright)
- Kode wilayah administratif: Kemendagri, lewat
  [api-wilayah-indonesia](https://github.com/emsifa/api-wilayah-indonesia)

---

> **CuacaKita adalah platform analisis informasi.** Untuk peringatan cuaca dan
> kebencanaan resmi, ikuti informasi dari BMKG dan BPBD setempat. Dalam
> keadaan darurat, hubungi **112**.
