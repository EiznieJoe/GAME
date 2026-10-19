// 12 karakter SVG (6 lelaki, 6 perempuan, selang-seli). Tiada aset luar.
const OL = '#2d2233';
const CHARS = [
  { bg: '#cfe3ff', outfit: 'melayu', hat: 'songkok', skin: '#f3cfae', top: '#1f2a5c', bottom: '#8c93a8', eyes: 'happy' },
  { bg: '#ffd6e0', outfit: 'kurung', hat: 'tudung', hatc: '#f0607e', skin: '#f6d3b8', top: '#6cc96c', bottom: '#4aa8e0', glasses: true, eyes: 'open' },
  { bg: '#fdeec2', outfit: 'melayu', hat: 'songkok', skin: '#e8b88f', top: '#f4ecd8', bottom: '#c9b27c', eyes: 'happy' },
  { bg: '#d4ecff', outfit: 'kurung', hat: 'tudung', hatc: '#3d8fe0', skin: '#f3cdb0', top: '#9fd4f5', bottom: '#2f6fb8', eyes: 'happy' },
  { bg: '#d9f5dd', outfit: 'tee', hat: 'spiky', hair: '#2b2020', skin: '#f0c8a4', top: '#3a8cff', bottom: '#34405e', eyes: 'open' },
  { bg: '#ffe0ea', outfit: 'dress', hat: 'pigtails', hair: '#1d1717', skin: '#f6d6b6', top: '#ff5c7a', eyes: 'happy' },
  { bg: '#ffe6c4', outfit: 'tee', hat: 'short', hair: '#1d1717', skin: '#b97c4f', top: '#ff9a2e', bottom: '#2f3b52', eyes: 'open' },
  { bg: '#e6dcff', outfit: 'kurung', hat: 'bun', hair: '#3b2418', skin: '#e8b88f', top: '#ffd23c', bottom: '#8a5cf6', eyes: 'happy' },
  { bg: '#cdf3e6', outfit: 'tee', hat: 'cap', hatc: '#22b07d', hair: '#2b2020', skin: '#f3cfae', top: '#fafafa', bottom: '#3b4a6b', glasses: true, eyes: 'open' },
  { bg: '#eadcff', outfit: 'kurung', hat: 'tudung', hatc: '#9b6bdc', skin: '#e3ad84', top: '#e6d6ff', bottom: '#17b3a3', eyes: 'open' },
  { bg: '#ffd9d9', outfit: 'tee', hat: 'cap', hatc: '#ef4b4b', hair: '#3b2418', skin: '#c98d5f', top: '#ffd23c', bottom: '#4a5b88', eyes: 'happy' },
  { bg: '#cfeffa', outfit: 'dress', hat: 'ponytail', hair: '#5a3220', skin: '#f1c9a5', top: '#59c3e8', glasses: true, eyes: 'happy' },
];

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

function charBody(c) {
  const { skin, top, bottom } = c;
  const shoes = (col) => `<ellipse cx="86" cy="245" rx="12" ry="6" fill="${col}"/><ellipse cx="114" cy="245" rx="12" ry="6" fill="${col}"/>`;
  const legs = (col) => `<rect x="80" y="200" width="18" height="42" rx="8" fill="${col}"/><rect x="102" y="200" width="18" height="42" rx="8" fill="${col}"/>`;
  let sleeve = top, body = '';
  switch (c.outfit) {
    case 'melayu':
      body = legs(shade(top, -0.12)) + shoes('#2a2a2a')
        + `<rect x="70" y="138" width="60" height="70" rx="16" fill="${top}"/>`
        + `<rect x="67" y="190" width="66" height="26" rx="8" fill="${bottom}"/><path d="M67 199h66" stroke="${shade(bottom, 0.4)}" stroke-width="3"/>`
        + `<circle cx="100" cy="156" r="3" fill="#f2c94c"/><circle cx="100" cy="170" r="3" fill="#f2c94c"/>`;
      break;
    case 'kurung': {
      const dots = [[70, 212], [86, 224], [102, 212], [118, 224], [132, 212], [78, 232], [110, 234], [128, 232]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" opacity=".45"/>`).join('');
      body = shoes('#6b4a3a') + `<path d="M64 200h72l14 40H50z" fill="${bottom}"/>${dots}`
        + `<rect x="68" y="140" width="64" height="72" rx="18" fill="${top}"/>`;
      break;
    }
    case 'dress':
      sleeve = skin;
      body = `<rect x="86" y="222" width="12" height="22" rx="5" fill="${skin}"/><rect x="102" y="222" width="12" height="22" rx="5" fill="${skin}"/>` + shoes('#7a4a3a')
        + `<path d="M72 140h56l24 86H48z" fill="${top}"/><path d="M62 178h76" stroke="${shade(top, 0.45)}" stroke-width="4"/>`;
      break;
    default: // tee
      body = legs(bottom) + shoes('#fafafa')
        + `<rect x="72" y="138" width="56" height="58" rx="14" fill="${top}"/><path d="M92 138q8 10 16 0" stroke="${shade(top, -0.2)}" stroke-width="3" fill="none"/>`;
  }
  const arm = (cls, x) => `<g class="${cls}"><rect x="${x}" y="144" width="18" height="44" rx="9" fill="${sleeve}"/><circle cx="${x + 9}" cy="192" r="9" fill="${skin}"/></g>`;
  return `<ellipse cx="100" cy="248" rx="52" ry="8" fill="rgba(0,0,0,.16)"/>${body}${arm('arm-l', 52)}${arm('arm-r', 130)}`;
}

function charHead(c) {
  const { skin } = c;
  const hair = c.hair || '#2b2020';
  const hatc = c.hatc || '#ff5c7a';
  let back = '', front = '', ears = `<circle cx="57" cy="98" r="8" fill="${skin}"/><circle cx="143" cy="98" r="8" fill="${skin}"/>`;
  const fringe = `<path d="M56 90Q56 46 100 46Q144 46 144 90Q128 66 100 70Q72 66 56 90Z" fill="${hair}"/>`;
  switch (c.hat) {
    case 'tudung':
      ears = '';
      back = `<path d="M100 36C150 36 160 84 158 122C172 140 178 166 170 182Q100 194 30 182C22 166 28 140 42 122C40 84 50 36 100 36Z" fill="${hatc}"/>`
        + `<path d="M100 36C150 36 160 84 158 122" stroke="${shade(hatc, -0.18)}" stroke-width="3" fill="none"/>`
        + `<circle cx="100" cy="166" r="4.5" fill="#f2c94c"/>`;
      break;
    case 'songkok':
      front = `<path d="M63 80L67 44Q100 36 133 44L137 80Q100 71 63 80Z" fill="#1c1c24"/><path d="M65 72Q100 64 135 72" stroke="#c9a227" stroke-width="2.5" fill="none"/>`;
      break;
    case 'spiky':
      front = `<path d="M55 90L60 52L78 68L90 40L104 66L120 42L128 68L146 52L145 90Q100 60 55 90Z" fill="${hair}"/>`;
      break;
    case 'short':
      front = `<path d="M54 94Q50 42 100 42Q150 42 146 94Q132 62 100 64Q68 62 54 94Z" fill="${hair}"/>`;
      break;
    case 'cap':
      front = `<path d="M55 84Q55 42 100 42Q145 42 145 84Z" fill="${hatc}"/><path d="M50 84H150Q152 93 140 93H60Q48 93 50 84Z" fill="${shade(hatc, -0.2)}"/><circle cx="100" cy="44" r="4" fill="${shade(hatc, -0.2)}"/>`;
      break;
    case 'pigtails':
      back = `<circle cx="100" cy="92" r="47" fill="${hair}"/><circle cx="48" cy="84" r="17" fill="${hair}"/><circle cx="152" cy="84" r="17" fill="${hair}"/>`;
      front = fringe + `<circle cx="58" cy="72" r="5" fill="#ff5c7a"/><circle cx="142" cy="72" r="5" fill="#ff5c7a"/>`;
      break;
    case 'bun':
      back = `<circle cx="100" cy="92" r="47" fill="${hair}"/><circle cx="100" cy="38" r="18" fill="${hair}"/>`;
      front = fringe + `<rect x="88" y="52" width="24" height="5" rx="2.5" fill="#ff5c7a"/>`;
      break;
    case 'ponytail':
      back = `<path d="M136 66Q184 62 176 126Q164 98 138 100Z" fill="${hair}"/><circle cx="100" cy="92" r="47" fill="${hair}"/>`;
      front = fringe + `<circle cx="138" cy="70" r="5" fill="#ffd23c"/>`;
      break;
  }
  const eyes = c.eyes === 'happy'
    ? `<path d="M74 99q10-12 20 0M106 99q10-12 20 0" stroke="${OL}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="84" cy="98" r="6" fill="${OL}"/><circle cx="116" cy="98" r="6" fill="${OL}"/><circle cx="86" cy="96" r="2" fill="#fff"/><circle cx="118" cy="96" r="2" fill="#fff"/>`;
  const glasses = c.glasses
    ? `<circle cx="84" cy="98" r="15" fill="rgba(255,255,255,.2)" stroke="${OL}" stroke-width="3.5"/><circle cx="116" cy="98" r="15" fill="rgba(255,255,255,.2)" stroke="${OL}" stroke-width="3.5"/><path d="M99 98h2" stroke="${OL}" stroke-width="3.5"/>`
    : '';
  const face = `${ears}<circle cx="100" cy="94" r="43" fill="${skin}"/>${eyes}${glasses}`
    + `<ellipse cx="68" cy="112" rx="8" ry="5" fill="#ff7a93" opacity=".45"/><ellipse cx="132" cy="112" rx="8" ry="5" fill="#ff7a93" opacity=".45"/>`
    + `<path d="M91 111q9 12 18 0z" fill="#b3394a" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`;
  return back + face + front;
}

function charSVG(i, headOnly) {
  const c = CHARS[i] || CHARS[0];
  const vb = headOnly ? '28 22 144 144' : '0 0 200 260';
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${headOnly ? '' : charBody(c)}${charHead(c)}</svg>`;
}
