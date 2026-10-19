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

const api = connect(onMsg, (a) => {
  const s = store.get();
  if (s) a.send({ t: 'hostrejoin', pin: s.pin, key: s.key });
});

$('#create').onclick = () => api.send({ t: 'create', ...cfg });
$('#start').onclick = () => api.send({ t: 'start' });
$('#skip').onclick = () => api.send({ t: 'skip' });
$('#next').onclick = () => api.send({ t: 'next' });
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

function lobby(m) {
  show('s-lobby');
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
  stopTimer = runTimer($('#qt'), $('#qbar'), q.left, q.time * 1000);
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
  $('#next').textContent = m.last ? 'Lihat keputusan akhir' : 'Soalan seterusnya';
  show('s-reveal');
}

function end(m) {
  stopTimer();
  const pod = $('#podium');
  const order = [m.board[1], m.board[0], m.board[2]].filter(Boolean);
  const cls = { 0: 'p1', 1: 'p2', 2: 'p3' };
  pod.replaceChildren(...order.map((p) => {
    const idx = m.board.indexOf(p);
    const d = el('div', 'pod ' + cls[idx]);
    const blk = el('div', 'blk', ['🥇', '🥈', '🥉'][idx]);
    d.append(avatarEl(p.a, 72), el('div', 'nm', p.n), el('div', '', p.s.toLocaleString('en-US')), blk);
    return d;
  }));
  renderBoard($('#end-lb'), m.board);
  show('s-end');
  confetti(60);
}
