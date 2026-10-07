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
| [Open-Meteo Marine](https://open-meteo.com) | Gelombang laut | **Tidak perlu** | Tinggi, arah, dan periode gelombang untuk kota pesisir |
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
│   ├── dashboard/            Ringkasan cuaca + dampak
│   ├── peringatan/           Sistem peringatan + daftar kota nasional
│   ├── komoditas/            Dua belas komoditas + simulasi pengandaian
│   ├── petani/               Mode Petani: komoditas tersimpan + jadwal kerja
│   ├── perjalanan/           Mode Perjalanan: kota sejalur + jam berangkat
│   ├── nelayan/              Kondisi laut + ambang keselamatan pelayaran
│   ├── pasokan/              Rantai cuaca → produksi → pasokan → harga
│   ├── peta/                 Peta cuaca & risiko (Leaflet)
│   ├── histori/              Histori dan perbandingan antarperiode
│   └── api/cuaca/            Route API dengan validasi Zod
│
├── server/                   Hanya berjalan di server ("server-only")
│   ├── sources/
│   │   ├── open-meteo.ts     Adapter Open-Meteo (mesin utama)
│   │   ├── bmkg.ts           Adapter BMKG (pembanding resmi)
│   │   ├── laut.ts           Adapter gelombang + pencarian perairan terdekat
│   │   └── elevasi.ts        Kisi ketinggian untuk analisis cekungan
│   ├── cuaca.ts              Orkestrasi satu halaman
│   ├── peta.ts               Data peta — 205 kota dalam SATU permintaan
│   └── histori.ts            Data historis + periode pembanding
│
├── lib/
│   ├── weather/              Bentuk data kanonik + pemetaan kode WMO
│   ├── impact/
│   │   ├── engine.ts         Enam sektor, bobot, dan skenario simulasi
│   │   ├── rantai.ts         Rantai dampak + tingkat keyakinan
│   │   ├── pasokan.ts        Lima langkah cuaca sampai harga
│   │   ├── komoditas.ts      Profil kepekaan dua belas komoditas
│   │   ├── petani.ts         Fase tanam + jadwal kerja kebun tujuh hari
│   │   ├── perjalanan.ts     Kota dekat garis asal-tujuan + jam berangkat
│   │   ├── nelayan.ts        Klasifikasi gelombang + ambang per jenis kapal
│   │   ├── topografi.ts      Analisis cekungan dari kisi ketinggian
│   │   ├── harian.ts         Jendela kegiatan + hal yang sering ditemui
│   │   ├── peringatan.ts     Ambang peringatan mengacu klasifikasi BMKG
│   │   ├── saran.ts          Saran harian bahasa sehari-hari
│   │   ├── tanya.ts          Tanya jawab terarah dari data
│   │   └── insight.ts        Penyusun ringkasan deterministik
│   └── lokasi.ts             Daftar kota terverifikasi
│
├── components/               Komponen UI
└── data/wilayah.json         205 kota, tiap kode adm4 sudah diuji ke BMKG
```

Setiap adapter sumber data wajib menghasilkan bentuk kanonik di
`src/lib/weather/types.ts`. Seluruh aplikasi hanya bicara dengan tipe itu,
tidak pernah langsung dengan bentuk mentah milik penyedia — sehingga sumber
data dapat diganti tanpa menyentuh satu pun komponen.

---

## Untuk pengunjung yang baru pertama kali

Bagian pertama yang dibaca bukan angka, melainkan satu kalimat yang bisa
langsung ditindaklanjuti, lalu tiga pertanyaan yang memang ditanyakan orang
sehari-hari: perlu bawa payung, aman berkendara, jemuran cepat kering.
Skor dan rumus baru muncul setelahnya, bagi yang ingin menelusuri.

**Tanya CuacaKita** memakai daftar pertanyaan siap pakai, bukan kolom ketik
bebas. Bagi orang yang baru membuka situs cuaca, melihat pertanyaan yang
memang ada di kepalanya lebih membantu daripada kursor berkedip.

## Mode Petani

Petani tidak bertanya "berapa milimeter hujan besok", melainkan "kapan saya
bisa menyemprot" dan "hari mana yang cukup kering untuk panen". Mode Petani
menyimpan komoditas yang ditanam beserta **tahapnya** — hujan yang sama bisa
tidak berarti apa-apa pada masa tumbuh tetapi merugikan saat berbunga — lalu
menilai tujuh hari ke depan untuk lima pekerjaan kebun.

Hasilnya konsisten dengan sendirinya: hari yang hujan menjatuhkan nilai
menyemprot, memanen, dan menjemur, sekaligus menaikkan nilai memupuk dan
menanam. Hubungan terbalik itu muncul dari rumusnya, bukan ditulis manual.

Pilihan disimpan di penyimpanan peramban pengguna — tanpa akun, tanpa basis
data, tidak dikirim ke mana pun. Konsekuensinya disampaikan di layar: pilihan
hanya berlaku di perangkat itu.

## Dua sumber kode wilayah

`scripts/bangun-wilayah.mjs` memakai dataset lama dan harus **menebak**
kode desa dengan pola umum (1001, 2001, 1002). Itulah penyebab kegagalan
terbesarnya: Kota Batam, misalnya, tidak punya desa bernomor 1001 — daftarnya
mulai dari 1002.

`scripts/tambah-wilayah.mjs` memakai [wilayah.id](https://wilayah.id), data
Permendagri yang masih dipelihara dan kodenya **sudah berformat titik persis
seperti yang diminta BMKG**. Tidak ada yang ditebak: kode desa diambil apa
adanya dari daftar. Sumber ini juga sudah mengenal pemekaran Papua menjadi
enam provinsi, yang membuat beberapa kota tidak ditemukan pada dataset lama.

Keduanya tetap menguji setiap kode ke BMKG sebelum menuliskannya.

## Batas laju yang nyata

Open-Meteo menghitung kuota **per lokasi**, jadi satu permintaan peta untuk
205 kota bernilai 205 panggilan. Pada irama 15 menit itu menjadi sekitar 800
panggilan per jam hanya untuk peta, dan pengujian memang memicu HTTP 429.
Karena itu pengambilan massal memakai jendela cache 30 menit, dan status 429
ditangani dengan pesan tersendiri — bukan dibiarkan jatuh sebagai galat umum.

## Deteksi lokasi

Koordinat dari peramban **tidak pernah dikirim ke mana pun** — tidak ke
server CuacaKita, tidak ke layanan geocoding. Daftar kota sudah ikut terkirim
bersama halaman, jadi pencocokan kota terdekat dihitung sepenuhnya di
perangkat pengguna, dan yang berpindah hanyalah nama kotanya. Bila kota
pantauan terdekat lebih dari 120 km, pengguna diberi tahu jaraknya dan
dibiarkan memutuskan sendiri.

## Peta

Tiga peta dasar, semuanya bebas kunci API: **Standar** (OpenStreetMap),
**Medan** (OpenTopoMap, menampilkan kontur dan ketinggian), dan **Satelit**
(Esri World Imagery).

Lapisan **Arah angin** menggambar panah yang menunjuk ke arah angin
*bertiup* — bukan arah datangnya. Keduanya sering tertukar, dan panah yang
terbalik lebih buruk daripada tidak ada panah sama sekali. Tiap panah
digambar dua kali, putih tebal di bawah dan berwarna di atasnya, karena tanpa
halo itu panah biru lenyap di atas laut biru peta Medan dan Satelit.

## Kondisi laut

Berbeda dari modul lain, ambang di sini **tidak disusun sendiri**. Dipakai
klasifikasi tinggi gelombang BMKG (Tenang sampai Sangat Ekstrem) dan tabel
peringatan keselamatan pelayaran BMKG, yang memasangkan kecepatan angin dan
tinggi gelombang per jenis kapal. Nyawa nelayan terlalu mahal untuk
dipertaruhkan pada ambang karangan sendiri.

Perairan terdekat dicari saat permintaan: enam belas titik calon (delapan
arah mata angin pada dua jarak) dikirim dalam satu permintaan, dan yang
menjawab dengan angka berarti benar-benar laut. API ini mengembalikan
`null` untuk titik daratan, jadi ia tidak pernah mengarang angka — dan
null itu sendiri yang dipakai untuk menemukan laut. Kota tanpa titik laut
dalam jangkauan memang bukan kota pesisir, dan panelnya tidak ditampilkan.

## Mode Perjalanan

Tanpa data rute, perjalanan tetap bisa dibantu: dari 205 kota yang cuacanya
dipantau, dipilih yang letaknya dekat dengan **garis lurus** antara asal dan
tujuan. Jarak tiap kota ke garis itu ditampilkan, dan yang lebih dari 30 km
ditandai "agak jauh dari garis" — berguna sebagai jalur alternatif, tetapi
belum tentu benar-benar dilewati.

Gambaran keseluruhan diambil dari **ruas terberat**, bukan dirata-ratakan:
perjalanan hanya senyaman bagian terburuknya. Jam berangkat dinilai dari cuaca
di kota asal saja, dan keterbatasan itu disebutkan di layar karena perjalanan
jauh melewati cuaca yang berganti-ganti.

## Mengapa tidak ada nama jalan

Permintaan yang paling sering muncul adalah "sebutkan jalan mana yang harus
dihindari karena banjir". CuacaKita **tidak** memenuhinya, karena tidak punya
data jaringan jalan, catatan titik banjir per ruas, data saluran air, maupun
lalu lintas. Menyebut nama jalan berarti mengarang, dan karangan semacam itu
berbahaya — orang bisa memutar ke jalan yang justru lebih buruk.

Yang dihitung sungguhan adalah **bentuk tanah**: kisi ketinggian 81 titik
(sekitar 10 × 10 km) diambil per kota, lalu cekungan dideteksi dengan bentuk
sederhana Topographic Position Index dan dikalikan pemicu hujan. Hasilnya
disampaikan sebagai **arah dan jarak** dari pusat kota.

## Sistem peringatan

Istilah resmi BMKG — "Waspada", "Siaga", "Awas" — **sengaja tidak dipakai**.
Ketiganya punya arti tertentu dalam sistem peringatan dini nasional, dan
memakainya akan membuat indikator analitis tampak seperti pengumuman
pemerintah. CuacaKita memakai "Perhatian" dan "Penting". Ambang batasnya
sendiri mengacu pada klasifikasi curah hujan BMKG.

Saat tidak ada peringatan, halaman tetap menampilkan tiap pengukuran
berdampingan dengan ambangnya, sehingga "aman" bisa diperiksa, bukan sekadar
diklaim.

## Gerak

Ikon cuaca benar-benar bergerak sesuai artinya — hujan jatuh bergantian,
matahari berputar pelan, petir berkedip tidak beraturan, awan mengapung.
Kartu muncul bertahap saat halaman dibuka, bukan serentak. Seluruh animasi
berhenti otomatis bila pengguna menyalakan "kurangi gerak" di sistem
operasinya.

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
