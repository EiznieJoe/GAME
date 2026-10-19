const AVATARS = [
  { e: '👦', c: '#4fc3f7' }, { e: '👧', c: '#f48fb1' },
  { e: '👨‍🎓', c: '#81c784' }, { e: '👩‍🎓', c: '#ffb74d' },
  { e: '🦸‍♂️', c: '#e57373' }, { e: '🦸‍♀️', c: '#ba68c8' },
  { e: '🧙‍♂️', c: '#7986cb' }, { e: '🧙‍♀️', c: '#4db6ac' },
  { e: '👨‍🍳', c: '#ffd54f' }, { e: '👩‍🍳', c: '#ff8a65' },
  { e: '👨‍🚀', c: '#90a4ae' }, { e: '👩‍🚀', c: '#f06292' },
];
const SHAPES = ['▲', '◆', '●', '■'];

const $ = (s, r = document) => r.querySelector(s);
function el(tag, cls, text) {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (text != null) d.textContent = text;
  return d;
}
function avatarEl(i, size) {
  const a = AVATARS[i] || AVATARS[0];
  const d = el('div', 'avatar', a.e);
  d.style.background = a.c;
  if (size) d.style.setProperty('--s', size + 'px');
  return d;
}
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
  window.scrollTo(0, 0);
}

function connect(onMsg, onOpen) {
  let ws, retry = 0;
  const conn = el('div', 'hidden', 'Menyambung semula…');
  conn.id = 'conn';
  document.body.appendChild(conn);
  const api = { send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } };
  function open() {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    ws.onopen = () => { retry = 0; conn.classList.add('hidden'); onOpen && onOpen(api); };
    ws.onmessage = (e) => onMsg(JSON.parse(e.data));
    ws.onclose = () => { conn.classList.remove('hidden'); setTimeout(open, Math.min(3000, 400 + retry++ * 400)); };
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
function runTimer(numEl, barEl, ms, total) {
  const end = performance.now() + ms;
  barEl.style.transition = 'none';
  barEl.style.transform = `scaleX(${ms / total})`;
  void barEl.offsetWidth;
  barEl.style.transition = `transform ${ms}ms linear`;
  barEl.style.transform = 'scaleX(0)';
  let raf;
  const tick = () => {
    const left = Math.max(0, end - performance.now());
    const s = Math.ceil(left / 1000);
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
