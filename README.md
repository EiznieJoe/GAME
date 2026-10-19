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
