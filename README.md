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

## Deploy percuma: Netlify (frontend) + Render (server)

Netlify tak boleh jalankan server WebSocket, jadi dibahagi dua. Pemain tak perlu WiFi sama, cuma buka link.

1. **Render (server game)**: render.com > New > Blueprint > pilih repo ini. `render.yaml` dah siap (plan free).
   Dapat URL, contoh `https://vocab-kuiz.onrender.com`. Test: buka `<url>/healthz`, mesti keluar `ok`.
2. **Netlify (frontend)**: Add new site > Import from Git > pilih repo ini. `netlify.toml` dah set folder `public`, tiada build command.
3. Edit `public/config.js`, letak URL Render:
   ```js
   window.VK_SERVER = 'https://vocab-kuiz.onrender.com';
   ```
   Commit dan push. Netlify auto deploy.
4. Host buka `https://<nama-site>.netlify.app/host`. QR di lobi sudah mengandungi PIN, pemain scan terus.

Nota Render free tier: tidur selepas 15 minit tanpa aktiviti, ambil ~1 minit untuk bangun. Halaman Netlify ping server
awal-awal bila dibuka, tapi buka `/host` beberapa minit sebelum kelas supaya selamat.
Kalau nak ringkas, boleh deploy semua di Render sahaja (biar `config.js` kosong) dan skip Netlify.

Alternatif tanpa deploy: `npm start` di laptop, kemudian `cloudflared tunnel --url http://localhost:3000` untuk link awam.

## Karakter, QR, bunyi

- 12 karakter SVG dalam `public/characters.js` (6 lelaki, 6 perempuan). Pemain boleh tukar dalam lobi dan buat animasi Lompat/Lambai/Menari/Pusing.
- Muzik latar dan kesan bunyi dijana oleh `public/sound.js` (WebAudio, tiada fail audio). Muzik main di skrin host,
  pemain dapat kesan bunyi betul/salah sahaja. Butang bisu di penjuru skrin.
- QR code guna library `qrcode-generator` (MIT), salinan di `public/qrcode.js`.
