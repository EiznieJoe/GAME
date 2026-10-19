const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { VERBS, NOUNS } = require('./vocab');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const AVATAR_COUNT = 12;
const OPTION_COUNT = 4;

// ---------- static ----------
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  if (url === '/host') url = '/host.html';
  const file = path.normalize(path.join(PUBLIC, url));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Tak jumpa'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---------- soalan ----------
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
const tokens = (s) => s.split(',').map((x) => x.trim());
const overlaps = (a, b) => tokens(a).some((t) => tokens(b).includes(t));

function buildQuestions(set, count, mode) {
  const pool = set === 'verbs' ? VERBS : set === 'nouns' ? NOUNS : [...VERBS, ...NOUNS];
  return shuffle(pool).slice(0, count).map((w) => {
    let kind;
    if (mode === 'pic') kind = w.pic ? 'pic' : 'ms2en';
    else if (mode === 'text') kind = pickOne(['en2ms', 'ms2en']);
    else kind = pickOne(w.pic ? ['pic', 'pic', 'en2ms', 'ms2en'] : ['en2ms', 'ms2en']);

    const field = kind === 'en2ms' ? 'ms' : 'en';
    const sameKind = pool.filter((x) => x.pos === w.pos && x !== w);
    const others = (sameKind.length >= 12 ? sameKind : pool.filter((x) => x !== w))
      .filter((x) => x.en !== w.en && !overlaps(x.ms, w.ms) && (kind !== 'pic' || x.e !== w.e));
    const seen = new Set([w[field]]);
    const wrong = [];
    for (const x of shuffle(others)) {
      if (seen.has(x[field])) continue;
      seen.add(x[field]); wrong.push(x[field]);
      if (wrong.length === OPTION_COUNT - 1) break;
    }
    const options = shuffle([w[field], ...wrong]);
    return {
      kind,
      prompt: kind === 'pic' ? '' : kind === 'en2ms' ? w.en : w.ms,
      emoji: kind === 'pic' ? w.e : '',
      options,
      answer: options.indexOf(w[field]),
      answerText: w[field],
      word: w,
    };
  });
}

// ---------- bilik ----------
const rooms = new Map();
const rand = (n) => crypto.randomInt(0, n);

function newPin() {
  let pin;
  do { pin = String(100000 + rand(900000)); } while (rooms.has(pin));
  return pin;
}

const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14);

function ranked(room) {
  const list = [...room.players.values()].sort((a, b) => b.score - a.score || a.joined - b.joined);
  let last = null, rank = 0;
  list.forEach((p, i) => { if (p.score !== last) { rank = i + 1; last = p.score; } p.rank = rank; });
  return list;
}
const row = (p) => ({ id: p.id, n: p.name, a: p.avatar, s: p.score, r: p.rank });

function lobbyMsg(room) {
  return { t: 'lobby', pin: room.pin, players: [...room.players.values()].map((p) => ({ id: p.id, n: p.name, a: p.avatar })) };
}

const joinedMsg = (room, p) => ({ t: 'joined', id: p.id, pin: room.pin, name: p.name, avatar: p.avatar });

function pushLobby(room) { if (room.phase === 'lobby') send(room.host, lobbyMsg(room)); }

// papan kedudukan live: dihantar bila skor berubah (throttle supaya tak banjir)
function scheduleBoard(room) {
  if (room.boardTimer) return;
  room.boardTimer = setTimeout(() => { room.boardTimer = null; pushBoard(room); }, 250);
}
function pushBoard(room) {
  const list = ranked(room);
  const top = list.slice(0, 8).map(row);
  send(room.host, { t: 'board', top, total: list.length });
  for (const p of list) send(p.ws, { t: 'board', top: top.slice(0, 5), me: me(p), total: list.length });
}
const me = (p) => ({ rank: p.rank, score: p.score, streak: p.streak, moved: p.prevRank ? p.prevRank - p.rank : 0 });

function questionMsg(room, left) {
  const q = room.qs[room.qi];
  return { t: 'question', i: room.qi, n: room.qs.length, kind: q.kind, prompt: q.prompt, emoji: q.emoji, options: q.options, time: room.time, left };
}

function startQuestion(room) {
  room.phase = 'question';
  room.qStart = Date.now();
  const list = ranked(room);
  for (const p of list) { p.prevRank = p.rank; p.answer = null; p.gain = 0; p.reveal = null; }
  room.hostReveal = null;
  send(room.host, questionMsg(room, room.time * 1000));
  send(room.host, { t: 'answered', count: 0, total: connectedCount(room) });
  for (const p of list) send(p.ws, questionMsg(room, room.time * 1000));
  pushBoard(room);
  clearTimeout(room.timer);
  room.timer = setTimeout(() => reveal(room), room.time * 1000 + 300);
}

const connectedCount = (room) => [...room.players.values()].filter((p) => p.ws).length;

function reveal(room) {
  if (room.phase !== 'question') return;
  clearTimeout(room.timer);
  room.phase = 'reveal';
  const q = room.qs[room.qi];
  const counts = new Array(OPTION_COUNT).fill(0);
  for (const p of room.players.values()) {
    if (p.answer) counts[p.answer.idx]++;
    else p.streak = 0;
  }
  const list = ranked(room);
  const top = list.slice(0, 8).map(row);
  const last = room.qi === room.qs.length - 1;
  room.hostReveal = { t: 'reveal', correct: q.answer, answerText: q.answerText, emoji: q.word.e, word: q.word.en, ms: q.word.ms, counts, top, total: list.length, last };
  send(room.host, room.hostReveal);
  for (const p of list) {
    p.reveal = {
      t: 'reveal', correct: q.answer, answerText: q.answerText, picked: p.answer ? p.answer.idx : -1,
      ok: !!p.answer && p.answer.idx === q.answer, gained: p.gain, me: me(p), top: top.slice(0, 5), total: list.length, last,
      word: q.word.en, ms: q.word.ms, emoji: q.word.e,
    };
    send(p.ws, p.reveal);
  }
}

function endGame(room) {
  clearTimeout(room.timer);
  room.phase = 'end';
  const list = ranked(room);
  room.endData = list.slice(0, 50).map(row);
  send(room.host, { t: 'end', board: room.endData, total: list.length });
  for (const p of list) send(p.ws, { t: 'end', board: room.endData.slice(0, 5), me: me(p), total: list.length, correct: p.correct, asked: room.qs.length });
}

function handleAnswer(room, p, idx) {
  if (room.phase !== 'question' || p.answer) return;
  if (!Number.isInteger(idx) || idx < 0 || idx >= OPTION_COUNT) return;
  const elapsed = Date.now() - room.qStart;
  if (elapsed > room.time * 1000 + 800) return;
  const q = room.qs[room.qi];
  p.answer = { idx, at: elapsed };
  if (idx === q.answer) {
    const frac = Math.min(1, elapsed / (room.time * 1000));
    p.gain = Math.round(1000 * (1 - frac / 2)) + Math.min(p.streak, 5) * 100;
    p.score += p.gain;
    p.streak++;
    p.correct++;
  } else {
    p.streak = 0;
  }
  send(p.ws, { t: 'locked' });
  const answered = [...room.players.values()].filter((x) => x.answer).length;
  send(room.host, { t: 'answered', count: answered, total: connectedCount(room) });
  scheduleBoard(room);
  const waiting = [...room.players.values()].filter((x) => x.ws && !x.answer).length;
  if (waiting === 0) setTimeout(() => reveal(room), 500);
}

// hantar balik keadaan semasa bila peranti sambung semula
function resync(room, who, p) {
  const ws = p ? p.ws : room.host;
  if (p) send(ws, joinedMsg(room, p));
  if (room.phase === 'lobby') return send(ws, lobbyMsg(room));
  if (room.phase === 'question') {
    const left = Math.max(0, room.time * 1000 - (Date.now() - room.qStart));
    send(ws, questionMsg(room, left));
    if (p && p.answer) send(ws, { t: 'locked' });
    if (!p) send(ws, { t: 'answered', count: [...room.players.values()].filter((x) => x.answer).length, total: connectedCount(room) });
  } else if (room.phase === 'reveal') {
    send(ws, p ? p.reveal : room.hostReveal);
  } else if (room.phase === 'end') {
    const list = ranked(room);
    send(ws, p ? { t: 'end', board: room.endData.slice(0, 5), me: me(p), total: list.length, correct: p.correct, asked: room.qs.length } : { t: 'end', board: room.endData, total: list.length });
  }
  pushBoard(room);
}

// ---------- websocket ----------
const wss = new WebSocketServer({ server, maxPayload: 4096 });

wss.on('connection', (ws) => {
  ws.ctx = {};
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    try { dispatch(ws, m); } catch (e) { console.error(e); }
  });
  ws.on('close', () => {
    const { room, player, isHost } = ws.ctx;
    if (!room) return;
    if (isHost && room.host === ws) { room.host = null; }
    if (player && player.ws === ws) {
      player.ws = null;
      if (room.phase === 'lobby') { pushLobby(room); }
      else if (room.phase === 'question') {
        send(room.host, { t: 'answered', count: [...room.players.values()].filter((x) => x.answer).length, total: connectedCount(room) });
      }
    }
  });
});

function dispatch(ws, m) {
  const ctx = ws.ctx;

  if (m.t === 'create') {
    const set = ['verbs', 'nouns', 'all'].includes(m.set) ? m.set : 'all';
    const mode = ['mix', 'pic', 'text'].includes(m.mode) ? m.mode : 'mix';
    const count = Math.min(40, Math.max(5, parseInt(m.count, 10) || 15));
    const time = Math.min(30, Math.max(5, parseInt(m.time, 10) || 15));
    const room = { pin: newPin(), key: crypto.randomBytes(8).toString('hex'), host: ws, players: new Map(), phase: 'lobby', set, mode, count, time, qs: [], qi: -1, active: Date.now() };
    rooms.set(room.pin, room);
    ctx.room = room; ctx.isHost = true;
    send(ws, { t: 'created', pin: room.pin, key: room.key, count, time });
    return pushLobby(room);
  }

  if (m.t === 'hostrejoin') {
    const room = rooms.get(String(m.pin));
    if (!room || room.key !== m.key) return send(ws, { t: 'nohost' });
    if (room.host && room.host !== ws) { try { room.host.close(); } catch {} }
    room.host = ws; ctx.room = room; ctx.isHost = true;
    send(ws, { t: 'created', pin: room.pin, key: room.key, count: room.count, time: room.time, resumed: true });
    return resync(room, 'host', null);
  }

  if (m.t === 'join') {
    const room = rooms.get(String(m.pin).trim());
    if (!room) return send(ws, { t: 'error', msg: 'PIN tak jumpa. Cuba semak balik.' });
    let name = cleanName(m.name);
    if (!name) return send(ws, { t: 'error', msg: 'Isi nama dulu.' });
    const avatar = Number.isInteger(m.avatar) && m.avatar >= 0 && m.avatar < AVATAR_COUNT ? m.avatar : 0;
    const names = new Set([...room.players.values()].map((p) => p.name.toLowerCase()));
    if (names.has(name.toLowerCase())) { let n = 2; while (names.has((name + n).toLowerCase())) n++; name += n; }
    if (room.players.size >= 100) return send(ws, { t: 'error', msg: 'Bilik dah penuh (maksimum 100).' });
    const p = { id: crypto.randomBytes(6).toString('hex'), name, avatar, ws, score: 0, streak: 0, correct: 0, rank: 0, prevRank: 0, answer: null, gain: 0, reveal: null, joined: Date.now() };
    room.players.set(p.id, p);
    ctx.room = room; ctx.player = p;
    send(ws, joinedMsg(room, p));
    pushLobby(room);
    if (room.phase !== 'lobby') resync(room, 'player', p);
    return;
  }

  if (m.t === 'rejoin') {
    const room = rooms.get(String(m.pin));
    const p = room && room.players.get(m.id);
    if (!p) return send(ws, { t: 'gone' });
    if (p.ws && p.ws !== ws) { p.ws.ctx.player = null; try { p.ws.close(); } catch {} }
    p.ws = ws; ctx.room = room; ctx.player = p;
    resync(room, 'player', p);
    return pushLobby(room);
  }

  const { room, player, isHost } = ctx;
  if (!room) return;
  room.active = Date.now();

  if (player && m.t === 'answer') return handleAnswer(room, player, m.idx);

  if (!isHost) return;
  if (m.t === 'start' && room.phase === 'lobby') {
    if (!room.players.size) return send(ws, { t: 'error', msg: 'Belum ada pemain lagi.' });
    room.qs = buildQuestions(room.set, room.count, room.mode);
    room.qi = 0;
    return startQuestion(room);
  }
  if (m.t === 'skip') return reveal(room);
  if (m.t === 'next' && room.phase === 'reveal') {
    if (room.qi >= room.qs.length - 1) return endGame(room);
    room.qi++;
    return startQuestion(room);
  }
  if (m.t === 'finish') return endGame(room);
  if (m.t === 'kick') {
    const p = room.players.get(m.id);
    if (!p) return;
    room.players.delete(p.id);
    send(p.ws, { t: 'gone', kicked: true });
    if (p.ws) { p.ws.ctx.player = null; }
    pushLobby(room);
    if (room.phase !== 'lobby') scheduleBoard(room);
    return;
  }
  if (m.t === 'again' && room.phase === 'end') {
    room.phase = 'lobby'; room.qi = -1; room.qs = [];
    for (const p of room.players.values()) Object.assign(p, { score: 0, streak: 0, correct: 0, rank: 0, prevRank: 0, answer: null, gain: 0, reveal: null });
    for (const p of room.players.values()) { send(p.ws, joinedMsg(room, p)); send(p.ws, lobbyMsg(room)); }
    return pushLobby(room);
  }
}

// buang sambungan mati & bilik lama
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); }
  const now = Date.now();
  for (const [pin, room] of rooms) if (now - room.active > 4 * 3600 * 1000) { clearTimeout(room.timer); rooms.delete(pin); }
}, 25000);

server.listen(PORT, () => {
  console.log(`\n  Vocab Kuiz jalan di port ${PORT}`);
  console.log(`  Host   : http://localhost:${PORT}/host`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const n of list || []) if (n.family === 'IPv4' && !n.internal) console.log(`  WiFi   : http://${n.address}:${PORT}  (pemain buka link ni)`);
  console.log('');
});

module.exports = { buildQuestions };
