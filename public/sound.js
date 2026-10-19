// Muzik latar + kesan bunyi dijana terus guna WebAudio. Tiada fail audio.
const Sound = (() => {
  let ctx = null, master = null, timer = null, cur = null, step = 0, nextT = 0;
  let muted = false;
  try { muted = localStorage.getItem('vk-mute') === '1'; } catch {}
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const TRACKS = {
    // lobi / papan kedudukan: santai, C major
    chill: {
      bpm: 112, wave: 'triangle', vol: 0.09,
      roots: [48, 45, 41, 43], scale: [60, 62, 64, 67, 69, 72, 74, 76],
      pats: [[0, 2, 4, 2, 5, 4, 2, -1], [4, 5, 4, 2, 0, 2, 4, -1], [2, 4, 5, 7, 5, 4, 2, 0], [0, -1, 2, 4, -1, 4, 2, -1]],
    },
    // semasa soalan: laju, A minor
    play: {
      bpm: 142, wave: 'square', vol: 0.05,
      roots: [45, 41, 48, 43], scale: [57, 60, 62, 64, 67, 69, 72, 74],
      pats: [[0, 2, 0, 3, 0, 4, 3, 2], [4, 3, 2, 3, 4, 5, 4, 2], [0, 0, 2, 0, 3, 3, 4, 2], [5, 4, 3, 2, 3, 4, 2, 0]],
    },
  };

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return true;
  }

  function tone(freq, t, dur, type, vol, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(t, dur, vol, hp) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t);
  }

  function playStep(T, s, t, dur) {
    const bar = Math.floor(s / 8), i = s % 8;
    const idx = T.pats[bar % T.pats.length][i];
    if (idx >= 0) tone(hz(T.scale[idx]), t, dur * 0.95, T.wave, T.vol);
    const root = T.roots[bar % 4];
    if (i === 0 || i === 4) tone(hz(root), t, dur * 1.8, 'triangle', 0.2);
    if (i === 0 || i === 4) tone(110, t, 0.12, 'sine', 0.25, 45); // kick
    if (i === 2 || i === 6) noise(t, 0.07, 0.07, 1800);          // snare
    if (i % 2 === 1) noise(t, 0.03, 0.04, 7000);                 // hat
  }

  function schedule() {
    const T = TRACKS[cur];
    if (!T || !ctx) return;
    const dur = 60 / T.bpm / 2;
    if (nextT < ctx.currentTime - 0.5) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.25) { playStep(T, step, nextT, dur); nextT += dur; step++; }
  }

  function seq(notes, gap, type = 'square', vol = 0.12, len = 0.2) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + 0.02;
    notes.forEach((n, k) => tone(hz(n), t0 + k * gap, len, type, vol));
  }

  const api = {
    unlock() { ensure(); },
    music(name) {
      if (name === cur) return;
      clearInterval(timer); timer = null; cur = null;
      if (!name || !ensure()) return;
      cur = name; step = 0; nextT = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 60);
    },
    stop() { api.music(null); },
    correct() { seq([72, 76, 79, 84], 0.08, 'triangle', 0.18, 0.25); },
    wrong() { if (ensure()) tone(220, ctx.currentTime + 0.02, 0.4, 'sawtooth', 0.12, 90); },
    tick() { if (ensure()) tone(1300, ctx.currentTime + 0.01, 0.05, 'square', 0.08); },
    join() { seq([76, 83], 0.09, 'triangle', 0.15, 0.18); },
    tap() { if (ensure()) tone(660, ctx.currentTime + 0.01, 0.06, 'triangle', 0.14); },
    fanfare() { seq([67, 67, 67, 72, 76, 79, 84, 84], 0.13, 'square', 0.12, 0.22); },
    get muted() { return muted; },
    setMuted(v) {
      muted = v;
      try { localStorage.setItem('vk-mute', v ? '1' : '0'); } catch {}
      if (master) master.gain.value = v ? 0 : 0.55;
    },
    // butang bisu di penjuru skrin
    button(top) {
      const b = document.createElement('button');
      b.id = 'mute';
      if (top) b.className = 'top';
      const paint = () => { b.textContent = muted ? '🔇' : '🔊'; b.title = muted ? 'Buka bunyi' : 'Bisukan'; };
      b.onclick = () => { api.setMuted(!muted); ensure(); paint(); };
      paint();
      document.body.appendChild(b);
    },
  };

  // pelayar hanya benarkan audio selepas sentuhan pertama
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => ensure(), { once: true }));
  return api;
})();
