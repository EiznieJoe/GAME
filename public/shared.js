const SHAPES = ['▲', '◆', '●', '■'];

const $ = (s, r = document) => r.querySelector(s);
function el(tag, cls, text) {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (text != null) d.textContent = text;
  return d;
}
// muka bulat (leaderboard, senarai pemain)
function avatarEl(i, size) {
  const d = el('div', 'avatar');
  d.style.background = (CHARS[i] || CHARS[0]).bg;
  d.innerHTML = charSVG(i, true);
  if (size) d.style.setProperty('--s', size + 'px');
  return d;
}
// karakter penuh (lobi, podium)
function charEl(i, width, action) {
  const d = el('div', 'char');
  d.innerHTML = charSVG(i, false);
  if (width) d.style.setProperty('--cw', width + 'px');
  if (action) doAction(d, action);
  return d;
}
function doAction(d, action) {
  d.classList.remove('act-lompat', 'act-lambai', 'act-menari', 'act-pusing');
  void d.offsetWidth;
  d.classList.add('act-' + action);
}
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  window.scrollTo(0, 0);
}

// Server game boleh di tempat lain (cth. Netlify untuk frontend, Render untuk server). Lihat config.js.
function serverBase() {
  const v = (window.VK_SERVER || '').trim().replace(/\/+$/, '');
  if (!v) return { ws: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host, http: '' };
  return { ws: v.replace(/^http/, 'ws'), http: v.replace(/^ws/, 'http') };
}

function connect(onMsg, onOpen) {
  let ws, retry = 0;
  const base = serverBase();
  const conn = el('div', 'hidden', 'Menyambung…');
  conn.id = 'conn';
  document.body.appendChild(conn);
  const api = { send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } };
  // server percuma tidur bila tak digunakan; sedarkan awal-awal
  if (base.http) fetch(base.http + '/healthz', { mode: 'no-cors' }).catch(() => {});
  function open() {
    ws = new WebSocket(base.ws);
    ws.onopen = () => { retry = 0; conn.classList.add('hidden'); onOpen && onOpen(api); };
    ws.onmessage = (e) => onMsg(JSON.parse(e.data));
    ws.onclose = () => {
      conn.textContent = retry > 1 ? 'Server tengah bangun, tunggu sekejap…' : 'Menyambung…';
      conn.classList.remove('hidden');
      setTimeout(open, Math.min(3000, 400 + retry++ * 400));
    };
  }
  open();
  return api;
}

// papan kedudukan dengan animasi bila kedudukan bertukar
function renderBoard(box, rows, meId) {
  const before = new Map([...box.children].map((c) => [c.dataset.id, c.getBoundingClientRect().top]));
  box.replaceChildren(...rows.map((r) => {
    const d = el('div', 'lb-row' + (r.id === meId ? ' me' : ''));
    d.dataset.id = r.id;
    d.append(el('div', 'rk', r.r), avatarEl(r.a), el('div', 'nm', r.n), el('div', 'sc', r.s.toLocaleString('en-US')));
    return d;
  }));
  for (const c of box.children) {
    const o = before.get(c.dataset.id);
    if (o == null) continue;
    const dy = o - c.getBoundingClientRect().top;
    if (dy) c.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
  }
}

// kiraan detik + bar masa. Pulangkan fungsi stop.
function runTimer(numEl, barEl, ms, total, onSecond) {
  const end = performance.now() + ms;
  barEl.style.transition = 'none';
  barEl.style.transform = `scaleX(${ms / total})`;
  void barEl.offsetWidth;
  barEl.style.transition = `transform ${ms}ms linear`;
  barEl.style.transform = 'scaleX(0)';
  let raf, last = -1;
  const tick = () => {
    const left = Math.max(0, end - performance.now());
    const s = Math.ceil(left / 1000);
    if (s !== last) { last = s; onSecond && onSecond(s); }
    numEl.textContent = s;
    numEl.classList.toggle('low', s <= 5 && s > 0);
    if (left > 0) raf = setTimeout(tick, 100);
  };
  tick();
  return () => clearTimeout(raf);
}

function questionHint(kind) {
  return kind === 'pic' ? 'Apa perkataan Bahasa Inggeris untuk gambar ni?'
    : kind === 'en2ms' ? 'Apa maksudnya dalam Bahasa Melayu?'
    : 'Apa perkataan Bahasa Inggeris untuk ini?';
}
function fillQuestionCard(card, q) {
  card.replaceChildren(el('div', 'hint', questionHint(q.kind)));
  if (q.kind === 'pic') card.append(el('div', 'emoji', q.emoji));
  else card.append(el('div', 'big', q.prompt));
}

function confetti(n = 40) {
  const bits = ['🎉', '⭐', '🎊', '✨', '🌈', '🏆'];
  for (let i = 0; i < n; i++) {
    const c = el('div', 'confetti', bits[i % bits.length]);
    c.style.left = Math.random() * 100 + 'vw';
    c.style.animationDuration = 2.5 + Math.random() * 2.5 + 's';
    c.style.animationDelay = Math.random() * 1.2 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 7000);
  }
}
