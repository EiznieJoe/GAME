let sess = null;          // { pin, id }
let myId = null;
let avatar = 0;
let stopTimer = () => {};
let locked = false;

const store = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { sessionStorage.removeItem(k); } catch {} },
};
const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

// ---- skrin join ----
const avBox = $('#avatars');
AVATARS.forEach((_, i) => {
  const b = el('button');
  b.type = 'button';
  b.append(avatarEl(i, 62));
  b.onclick = () => { avatar = i; lsSet('vk-avatar', i); markAvatar(); };
  avBox.append(b);
});
function markAvatar() { [...avBox.children].forEach((b, i) => b.classList.toggle('sel', i === avatar)); }
avatar = parseInt(lsGet('vk-avatar'), 10);
if (!(avatar >= 0 && avatar < AVATARS.length)) avatar = Math.floor(Math.random() * AVATARS.length);
markAvatar();
$('#name').value = lsGet('vk-name');
const qp = new URLSearchParams(location.search).get('pin');
if (qp) $('#pin').value = qp.replace(/\D/g, '').slice(0, 6);

$('#go').onclick = () => {
  const pin = $('#pin').value.trim();
  const name = $('#name').value.trim();
  $('#err').textContent = '';
  if (pin.length !== 6) return ($('#err').textContent = 'PIN mesti 6 digit.');
  if (!name) return ($('#err').textContent = 'Isi nama dulu.');
  lsSet('vk-name', name);
  api.send({ t: 'join', pin, name, avatar });
};
['pin', 'name'].forEach((id) => $('#' + id).addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); }));

// ---- mesej server ----
const api = connect(onMsg, (a) => {
  const s = store.get('vk-sess');
  if (s) a.send({ t: 'rejoin', pin: s.pin, id: s.id });
});

function me(m) {
  if (!m) return;
  const box = [$('#wait-me')];
  for (const b of box) b.replaceChildren(avatarEl(avatar, 54), el('span', '', `#${m.rank} · ${m.score.toLocaleString('en-US')}`));
}

function onMsg(m) {
  switch (m.t) {
    case 'joined':
      myId = m.id; avatar = m.avatar; sess = { pin: m.pin, id: m.id };
      store.set('vk-sess', sess);
      $('#lobby-me').replaceChildren(avatarEl(m.avatar, 54), el('span', '', m.name));
      show('s-lobby');
      break;
    case 'error':
      $('#err').textContent = m.msg;
      break;
    case 'gone':
      store.del('vk-sess'); sess = null; stopTimer();
      $('#err').textContent = m.kicked ? 'Kau dikeluarkan dari bilik.' : '';
      show('s-join');
      break;
    case 'lobby': {
      $('#lobby-count').textContent = `${m.players.length} pemain dalam bilik`;
      $('#lobby-players').replaceChildren(...m.players.map((p) => {
        const c = el('div', 'chip'); c.append(avatarEl(p.a, 38), el('span', '', p.n)); return c;
      }));
      break;
    }
    case 'question': showQuestion(m); break;
    case 'locked': lockedUI(); break;
    case 'board':
      if (document.getElementById('s-wait').classList.contains('on')) { renderBoard($('#wait-lb'), m.top, myId); me(m.me); }
      break;
    case 'reveal': showReveal(m); break;
    case 'end': showEnd(m); break;
  }
}

function showQuestion(q) {
  stopTimer();
  locked = false;
  $('#qn').textContent = `Soalan ${q.i + 1} / ${q.n}`;
  fillQuestionCard($('#qcard'), q);
  const box = $('#opts');
  box.replaceChildren(...q.options.map((text, i) => {
    const b = el('button', 'opt c' + i);
    b.append(el('span', 'sh', SHAPES[i]), el('span', 'tx', text));
    b.onclick = () => {
      if (locked) return;
      locked = true;
      api.send({ t: 'answer', idx: i });
      [...box.children].forEach((x, j) => { x.disabled = true; if (j !== i) x.classList.add('dim'); });
    };
    return b;
  }));
  show('s-question');
  stopTimer = runTimer($('#qt'), $('#qbar'), q.left, q.time * 1000);
}

function lockedUI() {
  locked = true;
  if (document.getElementById('s-question').classList.contains('on')) show('s-wait');
}

function showReveal(m) {
  stopTimer();
  const t = $('#r-title');
  if (m.ok) { t.textContent = 'Betul!'; $('#r-gain').textContent = `+${m.gained}`; }
  else { t.textContent = m.picked === -1 ? 'Tak sempat…' : 'Salah'; $('#r-gain').textContent = '+0'; }
  const mv = m.me.moved > 0 ? ` ▲${m.me.moved}` : m.me.moved < 0 ? ` ▼${-m.me.moved}` : '';
  $('#r-rank').textContent = '#' + m.me.rank + mv;
  $('#r-score').textContent = m.me.score.toLocaleString('en-US');
  $('#r-streak').textContent = m.me.streak;
  $('#r-note').textContent = `${m.emoji} ${m.word} = ${m.ms}`;
  renderBoard($('#reveal-lb'), m.top, myId);
  if (m.ok) confetti(14);
  show('s-reveal');
}

function showEnd(m) {
  stopTimer();
  const r = m.me.rank;
  $('#e-title').textContent = r === 1 ? 'Juara! 🏆' : r <= 3 ? 'Top 3! 🎉' : 'Tamat!';
  $('#e-rank').textContent = '#' + r;
  $('#e-score').textContent = m.me.score.toLocaleString('en-US');
  $('#e-correct').textContent = `${m.correct}/${m.asked}`;
  renderBoard($('#end-lb'), m.board, myId);
  show('s-end');
  if (r <= 3) confetti(50);
}
