# Vocab Kuiz

Kuiz kosa kata ala Kahoot. Cikgu/host cipta bilik, pemain masuk guna PIN, kedudukan bergerak live.

## Jalan

```
npm install
npm start
```

- Host (skrin projektor): `http://localhost:3000/host`
- Pemain: buka alamat WiFi yang terpapar di terminal, contoh `http://192.168.1.10:3000`, masukkan PIN.

Semua peranti kena dalam WiFi yang sama. Untuk main jarak jauh, deploy ke mana-mana host yang support Node + WebSocket
(Render, Railway, Fly.io). Start command: `npm start`. Port dibaca dari `PORT`.

## Cara main

- 3 jenis soalan: gambar -> perkataan Inggeris, Inggeris -> Melayu, Melayu -> Inggeris.
- Markah: 1000 untuk jawab serta-merta, turun hingga 500 bila masa hampir habis, tambah 100 setiap streak (maksimum +500).
- Papan kedudukan update live bila pemain jawab. Jawapan betul tak dipaparkan kepada pemain sehingga masa habis.
- Pemain yang terputus boleh sambung semula (refresh pun tak apa). Host boleh keluarkan pemain di lobi.

## Tambah perkataan

Edit `vocab.js`. Format: `['English', 'Melayu', 'emoji']`. Letak `0` di hujung kalau emoji tak sesuai jadi soalan gambar.
Gambar sekarang guna emoji. Boleh tukar ke gambar sebenar kemudian.

## Deploy percuma di Render

Satu servis sahaja (server + halaman). Pemain tak perlu WiFi sama, cuma buka link atau scan QR.

1. Push repo ke GitHub.
2. render.com > New > Blueprint > pilih repo ini. `render.yaml` dah siap (plan free). Kalau perlu, pilih branch yang betul.
3. Siap deploy dapat URL, contoh `https://vocab-kuiz.onrender.com`.
   Test: buka `<url>/healthz`, mesti keluar `ok`. Host buka `<url>/host`.

Free tier tidur selepas 15 minit tanpa aktiviti dan ambil ~1 minit untuk bangun. Buka `/host` 2-3 minit sebelum kelas.
Bilik disimpan dalam memory: kalau server tidur atau redeploy, bilik hilang (muat turun CSV sebelum tutup).

Alternatif tanpa deploy: `npm start` di laptop, kemudian `cloudflared tunnel --url http://localhost:3000` untuk link awam.
(`public/config.js` untuk letak frontend di tempat lain dari server. Biar kosong kalau guna Render sahaja.)

## Karakter, QR, bunyi

- 24 karakter SVG dalam `public/characters.js` (12 lelaki, 12 perempuan: songkok, kopiah, tudung, baju kurung, baju melayu, baju sekolah). Kalau tambah karakter, kemas kini `AVATAR_COUNT` di `server.js`. Pemain boleh tukar dalam lobi dan buat animasi Lompat/Lambai/Menari/Pusing.
- Muzik latar dan kesan bunyi dijana oleh `public/sound.js` (WebAudio, tiada fail audio). Muzik main di skrin host,
  pemain dapat kesan bunyi betul/salah sahaja. Butang bisu di penjuru skrin.
- QR code guna library `qrcode-generator` (MIT), salinan di `public/qrcode.js`.

## Muat turun CSV

Di skrin akhir host, tekan "Muat turun CSV". Fail mengandungi kedudukan, nama, markah, bilangan betul, peratus,
Betul/Salah untuk setiap soalan, dan baris peratus betul seluruh kelas bagi setiap perkataan (nampak perkataan mana yang lemah).
Buka dengan Excel atau Google Sheets.
