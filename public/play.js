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

Sound.button(true);

// ---- skrin join: preview besar + grid karakter ----
function paintPreview() {
  $('#preview').replaceChildren(charEl(avatar, 170), el('div', 'disc'));
}
function buildGrid(box, onPick) {
  box.replaceChildren(...CHARS.map((_, i) => {
    const b = el('button');
    b.type = 'button';
    b.dataset.i = i;
    b.append(avatarEl(i, 46));
    b.onclick = () => onPick(i);
    return b;
  }));
}
function markGrid(box) { [...box.children].forEach((b) => b.classList.toggle('sel', +b.dataset.i === avatar)); }

const joinGrid = $('#avatars');
buildGrid(joinGrid, (i) => { avatar = i; lsSet('vk-avatar', i); markGrid(joinGrid); paintPreview(); Sound.tap(); });
avatar = parseInt(lsGet('vk-avatar'), 10);
if (!(avatar >= 0 && avatar < CHARS.length)) avatar = Math.floor(Math.random() * CHARS.length);
markGrid(joinGrid);
paintPreview();
$('#name').value = lsGet('vk-name');
const qp = new URLSearchParams(location.search).get('pin');
if (qp) $('#pin').value = qp.replace(/\D/g, '').slice(0, 6);

$('#go').onclick = () => {
  Sound.unlock();
  const pin = $('#pin').value.trim();
  const name = $('#name').value.trim();
  $('#err').textContent = '';
  if (pin.length !== 6) return ($('#err').textContent = 'PIN mesti 6 digit.');
  if (!name) return ($('#err').textContent = 'Isi nama dulu.');
  lsSet('vk-name', name);
  api.send({ t: 'join', pin, name, avatar });
};
['pin', 'name'].forEach((id) => $('#' + id).addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#go').click(); }));

// ---- skrin lobi ----
let lobbyChar = null;
function paintLobbyChar() {
  lobbyChar = charEl(avatar, 190);
  $('#lobby-char').replaceChildren(lobbyChar);
}
document.querySelectorAll('.actions [data-act]').forEach((b) => {
  b.onclick = () => { doAction(lobbyChar, b.dataset.act); Sound.tap(); };
});
const picker = $('#picker-grid');
buildGrid(picker, (i) => { api.send({ t: 'avatar', avatar: i }); Sound.tap(); });
$('#change').onclick = () => { $('#picker').classList.toggle('hidden'); markGrid(picker); };

// ---- mesej server ----
const api = connect(onMsg, (a) => {
  const s = store.get('vk-sess');
  if (s) a.send({ t: 'rejoin', pin: s.pin, id: s.id });
});

function setJoined(m) {
  document.body.classList.add('joined');
  $('#topbar').classList.remove('hidden');
  $('#tb-pin').textContent = 'PIN ' + m.pin;
  $('#tb-name').textContent = m.name;
}

function onMsg(m) {
  switch (m.t) {
    case 'joined': {
      const first = !sess;
      myId = m.id; avatar = m.avatar; sess = { pin: m.pin, id: m.id };
      store.set('vk-sess', sess);
      setJoined(m);
      markGrid(picker);
      if (document.getElementById('s-lobby').classList.contains('on') || first) {
        paintLobbyChar();
        if (first) Sound.join();
        show('s-lobby');
      }
      break;
    }
    case 'error':
      $('#err').textContent = m.msg;
      break;
    case 'gone':
      store.del('vk-sess'); sess = null; stopTimer();
      document.body.classList.remove('joined');
      $('#topbar').classList.add('hidden');
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
      if (document.getElementById('s-wait').classList.contains('on')) { renderBoard($('#wait-lb'), m.top, myId); meCard(m.me); }
      break;
    case 'reveal': showReveal(m); break;
    case 'end': showEnd(m); break;
  }
}

function meCard(m) {
  if (!m) return;
  $('#wait-me').replaceChildren(avatarEl(avatar, 54), el('span', '', `#${m.rank} · ${m.score.toLocaleString('en-US')}`));
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
      Sound.tap();
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
  show('s-reveal');
  if (m.ok) { Sound.correct(); confetti(14); } else Sound.wrong();
}

function showEnd(m) {
  stopTimer();
  const r = m.me.rank;
  $('#e-title').textContent = `Tempat ke-${r} daripada ${m.total}`;
  $('#e-sub').textContent = `${m.me.score.toLocaleString('en-US')} mata • ${m.correct}/${m.asked} betul`;
  const ch = charEl(avatar, 200, r <= 3 ? 'menari' : 'lambai');
  $('#end-char').replaceChildren(ch);
  renderBoard($('#end-lb'), m.board, myId);
  show('s-end');
  Sound.fanfare();
  if (r <= 3) confetti(50);
}
