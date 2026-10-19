const cfg = { set: 'all', mode: 'mix', count: '15', time: '15' };
let stopTimer = () => {};
let curQ = null;

const store = {
  get() { try { return JSON.parse(sessionStorage.getItem('vk-host')); } catch { return null; } },
  set(v) { try { sessionStorage.setItem('vk-host', JSON.stringify(v)); } catch {} },
  del() { try { sessionStorage.removeItem('vk-host'); } catch {} },
};

for (const id of ['set', 'mode', 'count', 'time']) {
  $('#' + id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    cfg[id] = b.dataset.v;
    [...$('#' + id).children].forEach((x) => x.classList.toggle('sel', x === b));
  });
}

Sound.button();
const api = connect(onMsg, (a) => {
  const s = store.get();
  if (s) a.send({ t: 'hostrejoin', pin: s.pin, key: s.key });
});

$('#create').onclick = () => { Sound.unlock(); api.send({ t: 'create', ...cfg }); };
$('#start').onclick = () => { Sound.unlock(); api.send({ t: 'start' }); };
$('#skip').onclick = () => api.send({ t: 'skip' });
$('#next').onclick = () => api.send({ t: 'next' });
$('#csv').onclick = downloadCSV;
$('#again').onclick = () => api.send({ t: 'again' });
$('#newroom').onclick = () => { store.del(); location.reload(); };
document.addEventListener('keydown', (e) => {
  if (e.key !== ' ' && e.key !== 'Enter') return;
  if (document.getElementById('s-reveal').classList.contains('on')) { e.preventDefault(); $('#next').click(); }
});

function onMsg(m) {
  switch (m.t) {
    case 'created':
      store.set({ pin: m.pin, key: m.key });
      $('#pin').textContent = m.pin.replace(/(\d{3})(\d{3})/, '$1 $2');
      $('#joinhost').textContent = location.host;
      break;
    case 'nohost':
      store.del(); show('s-setup');
      break;
    case 'lobby':
      lobby(m);
      break;
    case 'question': question(m); break;
    case 'answered': $('#qans').textContent = `${m.count} / ${m.total} dah jawab`; break;
    case 'board':
      renderBoard($('#live-lb'), m.top.slice(0, 8));
      break;
    case 'reveal': revealScreen(m); break;
    case 'end': end(m); break;
    case 'error': alert(m.msg); break;
  }
}

let qrPin = '';
function paintQR(pin) {
  if (qrPin === pin) return;
  qrPin = pin;
  const qr = qrcode(0, 'M');
  qr.addData(`${location.origin}/?pin=${pin}`);
  qr.make();
  $('#qr').innerHTML = qr.createSvgTag(4, 0);
}

function lobby(m) {
  show('s-lobby');
  Sound.music('chill');
  paintQR(m.pin);
  $('#pin').textContent = m.pin.replace(/(\d{3})(\d{3})/, '$1 $2');
  $('#joinhost').textContent = location.host;
  $('#lobby-count').textContent = m.players.length ? `${m.players.length} pemain dah masuk` : 'Menunggu pemain…';
  $('#start').disabled = !m.players.length;
  $('#players').replaceChildren(...m.players.map((p) => {
    const c = el('div', 'chip kick');
    c.append(avatarEl(p.a, 38), el('span', '', p.n));
    c.title = 'Keluarkan';
    c.onclick = () => api.send({ t: 'kick', id: p.id });
    return c;
  }));
}

function optButtons(box, options, extra) {
  box.replaceChildren(...options.map((text, i) => {
    const b = el('div', 'opt c' + i);
    b.append(el('span', 'sh', SHAPES[i]), el('span', 'tx', text));
    if (extra) extra(b, i);
    return b;
  }));
}

function question(q) {
  stopTimer();
  curQ = q;
  $('#qn').textContent = `Soalan ${q.i + 1} / ${q.n}`;
  $('#qans').textContent = '0 dah jawab';
  fillQuestionCard($('#qcard'), q);
  optButtons($('#opts'), q.options);
  show('s-question');
  Sound.music('play');
  stopTimer = runTimer($('#qt'), $('#qbar'), q.left, q.time * 1000, (s) => { if (s > 0 && s <= 5) Sound.tick(); });
}

function revealScreen(m) {
  stopTimer();
  if (!curQ) return;
  $('#rn').textContent = `Soalan ${curQ.i + 1} / ${curQ.n}`;
  fillQuestionCard($('#rcard'), curQ);
  optButtons($('#ropts'), curQ.options, (b, i) => {
    b.classList.add(i === m.correct ? 'right' : 'dim');
    b.append(el('span', 'ct', m.counts[i]));
  });
  $('#rword').textContent = `${m.emoji}  ${m.word} = ${m.ms}`;
  renderBoard($('#rev-lb'), m.top);
  Sound.music('chill');
  $('#next').textContent = m.last ? 'Lihat keputusan akhir' : 'Soalan seterusnya';
  show('s-reveal');
}

let lastResults = null;

// elak CSV injection: sel bermula =, +, -, @ dianggap formula oleh Excel/Sheets
function csvCell(v) {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadCSV() {
  const r = lastResults;
  if (!r) return;
  const n = r.words.length;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '0%');
  const lines = [
    ['Kedudukan', 'Nama', 'Markah', 'Betul', 'Jumlah soalan', 'Peratus betul', ...r.words.map((w, i) => `S${i + 1} ${w}`)],
    ...r.rows.map((x) => [x.r, x.n, x.s, x.c, n, pct(x.c, n), ...x.h.map((v) => (v ? 'Betul' : 'Salah'))]),
    ['', 'Peratus betul (kelas)', '', '', '', '', ...r.words.map((_, i) => pct(r.rows.reduce((a, x) => a + x.h[i], 0), r.rows.length))],
  ];
  const csv = '\ufeff' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n');
  const d = new Date();
  const date = [d.getDate(), d.getMonth() + 1, d.getFullYear()].map((x, i) => String(x).padStart(i < 2 ? 2 : 4, '0')).join('-');
  const pin = (store.get() || {}).pin || 'bilik';
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `vocab-kuiz-${pin}-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function end(m) {
  lastResults = m.results;
  stopTimer();
  Sound.stop();
  Sound.fanfare();
  setTimeout(() => Sound.music('chill'), 2500);
  const pod = $('#podium');
  const order = [m.board[1], m.board[0], m.board[2]].filter(Boolean);
  const cls = ['p1', 'p2', 'p3'];
  pod.replaceChildren(...order.map((p) => {
    const idx = m.board.indexOf(p);
    const d = el('div', 'pod ' + cls[idx]);
    const tag = el('div', 'tag', p.n);
    tag.append(el('b', '', `${p.s.toLocaleString('en-US')} mata`));
    d.append(tag, charEl(p.a, null, idx === 0 ? 'menari' : 'lambai'), el('div', 'blk', ['1', '2', '3'][idx]));
    return d;
  }));
  renderBoard($('#end-lb'), m.board);
  show('s-end');
  confetti(60);
}
