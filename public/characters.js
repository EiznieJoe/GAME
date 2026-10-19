// 16 karakter chibi SVG (8 lelaki, 8 perempuan, selang-seli). Gaya Malaysia: tudung, songkok, baju kurung,
// baju melayu, baju sekolah. Shading guna gradient supaya nampak 3D lembut. Tiada aset luar.
const OL = '#3a2a32';
const CHARS = [
  { bg: '#cfe3ff', outfit: 'melayu', hat: 'songkok', skin: '#f3cfae', top: '#222a4a', bottom: '#9aa1b5', glasses: true, eyes: 'open' },
  { bg: '#ffd6e0', outfit: 'kurung', hat: 'tudung', hatc: '#f0607e', skin: '#f6d3b8', top: '#6cc96c', bottom: '#4aa8e0', glasses: true, eyes: 'open' },
  { bg: '#fdeec2', outfit: 'melayu', hat: 'songkok', skin: '#e8b88f', top: '#f4ecd8', bottom: '#c9b27c', eyes: 'happy' },
  { bg: '#d4ecff', outfit: 'kurung', hat: 'pigtails', hair: '#2a1c1c', skin: '#f6d3b8', top: '#8ed0f7', bottom: '#3a86d0', eyes: 'happy' },
  { bg: '#d9f5dd', outfit: 'tee', hat: 'spiky', hair: '#2b2020', skin: '#f0c8a4', top: '#3a8cff', bottom: '#34405e', eyes: 'open' },
  { bg: '#d4ecff', outfit: 'kurung', hat: 'tudung', hatc: '#3d8fe0', skin: '#f3cdb0', top: '#9fd4f5', bottom: '#2f6fb8', eyes: 'happy' },
  { bg: '#ffe6c4', outfit: 'tee', hat: 'short', hair: '#1d1717', skin: '#b97c4f', top: '#ff9a2e', bottom: '#2f3b52', eyes: 'open' },
  { bg: '#e6dcff', outfit: 'kurung', hat: 'bun', hair: '#3b2418', skin: '#e8b88f', top: '#ffd23c', bottom: '#8a5cf6', eyes: 'happy' },
  { bg: '#e3f0ff', outfit: 'sekbudak', hat: 'short', hair: '#1d1717', skin: '#f0c8a4', top: '#ffffff', bottom: '#2f63c4', eyes: 'open' },
  { bg: '#e8f1ff', outfit: 'sekgadis', hat: 'tudung', hatc: '#ffffff', skin: '#f3cdb0', top: '#ffffff', bottom: '#2f63c4', eyes: 'open' },
  { bg: '#cdf3e6', outfit: 'tee', hat: 'cap', hatc: '#22b07d', hair: '#2b2020', skin: '#f3cfae', top: '#fafafa', bottom: '#3b4a6b', glasses: true, eyes: 'open' },
  { bg: '#eadcff', outfit: 'kurung', hat: 'tudung', hatc: '#9b6bdc', skin: '#e3ad84', top: '#e6d6ff', bottom: '#17b3a3', eyes: 'open' },
  { bg: '#ffd9d9', outfit: 'tee', hat: 'cap', hatc: '#ef4b4b', hair: '#3b2418', skin: '#c98d5f', top: '#ffd23c', bottom: '#4a5b88', eyes: 'happy' },
  { bg: '#cfeffa', outfit: 'dress', hat: 'ponytail', hair: '#5a3220', skin: '#f1c9a5', top: '#59c3e8', glasses: true, eyes: 'happy' },
  { bg: '#d6f5d0', outfit: 'melayu', hat: 'songkok', skin: '#d9a57b', top: '#1f8f5a', bottom: '#e0b84a', eyes: 'happy' },
  { bg: '#ffe0ea', outfit: 'sekgadis', hat: 'pigtails', hair: '#1d1717', skin: '#f6d6b6', top: '#ffffff', bottom: '#2f63c4', eyes: 'open' },
];

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

let GRAD_SEQ = 0;

function charBody(c, G) {
  const { skin, top, bottom } = c;
  const st = (col) => `stroke="${shade(col, -0.45)}" stroke-width="2" stroke-linejoin="round"`;
  const shoes = (col) => `<ellipse cx="86" cy="243" rx="13" ry="6.5" fill="${col}" ${st(col)}/><ellipse cx="114" cy="243" rx="13" ry="6.5" fill="${col}" ${st(col)}/>`;
  const leg = (x, y, w, h, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${G(col)}" ${st(col)}/>`;
  const batik = [[70, 214], [90, 226], [110, 214], [128, 226], [78, 232], [100, 236], [124, 234]]
    .map(([x, y]) => `<path d="M${x} ${y}l4 4-4 4-4-4z" fill="#fff" opacity=".5"/>`).join('');
  let sleeve = top, body = '';
  switch (c.outfit) {
    case 'melayu':
      body = leg(78, 212, 20, 30, shade(top, -0.1)) + leg(102, 212, 20, 30, shade(top, -0.1)) + shoes('#2b2b33')
        + `<rect x="66" y="138" width="68" height="72" rx="18" fill="${G(top)}" ${st(top)}/>`
        + `<rect x="90" y="138" width="20" height="9" rx="4" fill="${shade(top, -0.18)}"/>`
        + `<circle cx="100" cy="157" r="3" fill="#f2c94c"/><circle cx="100" cy="171" r="3" fill="#f2c94c"/>`
        + `<rect x="62" y="192" width="76" height="26" rx="10" fill="${G(bottom)}" ${st(bottom)}/>`
        + `<path d="M68 205h64" stroke="${shade(bottom, 0.5)}" stroke-width="3" stroke-dasharray="5 4"/>`;
      break;
    case 'kurung':
      body = shoes('#6b4a3a') + `<path d="M62 204h76l14 36H48z" fill="${G(bottom)}" ${st(bottom)}/>${batik}`
        + `<rect x="66" y="142" width="68" height="72" rx="20" fill="${G(top)}" ${st(top)}/>`;
      break;
    case 'dress':
      sleeve = skin;
      body = `<rect x="86" y="222" width="12" height="20" rx="5" fill="${skin}"/><rect x="102" y="222" width="12" height="20" rx="5" fill="${skin}"/>` + shoes('#7a4a3a')
        + `<path d="M70 142h60l22 82H48z" fill="${G(top)}" ${st(top)}/><path d="M60 180h80" stroke="${shade(top, 0.5)}" stroke-width="4"/>`;
      break;
    case 'sekbudak':
      body = `<rect x="80" y="214" width="16" height="24" rx="6" fill="${skin}"/><rect x="104" y="214" width="16" height="24" rx="6" fill="${skin}"/>`
        + `<rect x="80" y="228" width="16" height="12" fill="#fff"/><rect x="104" y="228" width="16" height="12" fill="#fff"/>` + shoes('#2b2b33')
        + `<rect x="68" y="140" width="64" height="62" rx="16" fill="${G('#ffffff')}" ${st('#e8eef7')}/>`
        + `<rect x="72" y="192" width="56" height="28" rx="8" fill="${G(bottom)}" ${st(bottom)}/>`
        + `<path d="M90 140l10 14 10-14" fill="#e6eefb" stroke="#b9c7de" stroke-width="2"/><rect x="108" y="160" width="12" height="12" rx="2" fill="none" stroke="#b9c7de" stroke-width="2"/>`;
      break;
    case 'sekgadis':
      body = `<rect x="86" y="222" width="12" height="18" rx="5" fill="${skin}"/><rect x="102" y="222" width="12" height="18" rx="5" fill="${skin}"/>`
        + `<rect x="85" y="230" width="14" height="10" fill="#fff"/><rect x="101" y="230" width="14" height="10" fill="#fff"/>` + shoes('#2b2b33')
        + `<rect x="68" y="140" width="64" height="60" rx="16" fill="${G('#ffffff')}" ${st('#e8eef7')}/>`
        + `<path d="M74 146h12v14h28v-14h12l8 80H66z" fill="${G(bottom)}" ${st(bottom)}/>`
        + `<circle cx="100" cy="176" r="3" fill="#fff"/>`;
      break;
    default: // tee
      body = leg(76, 192, 22, 48, bottom) + leg(102, 192, 22, 48, bottom) + shoes('#fafafa')
        + `<rect x="68" y="138" width="64" height="58" rx="16" fill="${G(top)}" ${st(top)}/><path d="M90 138q10 11 20 0" stroke="${shade(top, -0.25)}" stroke-width="3" fill="none"/>`;
  }
  const ax = c.hat === 'tudung' ? 40 : 48;
  const arm = (cls, x) => `<g class="${cls}" style="transform-origin:${x + 9}px 154px"><rect x="${x}" y="148" width="18" height="46" rx="9" fill="${G(sleeve)}" ${st(sleeve)}/><circle cx="${x + 9}" cy="196" r="9.5" fill="${G(skin)}" ${st(skin)}/></g>`;
  return `<ellipse cx="100" cy="245" rx="54" ry="7" fill="rgba(0,0,0,.16)"/>${body}${arm('arm-l', ax)}${arm('arm-r', 200 - ax - 18)}`;
}

function charHead(c, G) {
  const { skin } = c;
  const hair = c.hair || '#2b2020';
  const hatc = c.hatc || '#ff5c7a';
  const st = (col, w = 2) => `stroke="${shade(col, -0.45)}" stroke-width="${w}" stroke-linejoin="round"`;
  let back = '', front = '';
  let ears = `<circle cx="54" cy="98" r="9" fill="${G(skin)}" ${st(skin)}/><circle cx="146" cy="98" r="9" fill="${G(skin)}" ${st(skin)}/>`;
  const fringe = `<path d="M50 94Q46 38 100 36Q154 38 150 94Q132 66 100 70Q68 66 50 94Z" fill="${G(hair)}" ${st(hair)}/>`;
  switch (c.hat) {
    case 'tudung':
      ears = '';
      back = `<path d="M100 28C154 28 166 80 162 118C178 140 186 168 176 184Q100 198 24 184C14 168 22 140 38 118C34 80 46 28 100 28Z" fill="${G(hatc)}" ${st(hatc, 2.5)}/>`
        + `<path d="M150 62C158 84 158 104 154 124M50 62C42 84 42 104 46 124" stroke="${shade(hatc, -0.16)}" stroke-width="3" fill="none" stroke-linecap="round"/>`
        + `<path d="M62 150Q100 172 138 150" stroke="${shade(hatc, -0.14)}" stroke-width="3" fill="none"/>`
        + `<circle cx="100" cy="170" r="4.5" fill="#f2c94c" stroke="#b8901a" stroke-width="1.5"/>`
        + `<circle cx="100" cy="92" r="52" fill="${shade(hatc, -0.18)}"/>`;
      break;
    case 'songkok':
      front = `<path d="M60 80L64 36Q100 26 136 36L140 80Q100 69 60 80Z" fill="${G('#262630')}" ${st('#262630')}/><path d="M62 70Q100 59 138 70" stroke="#c9a227" stroke-width="2.5" fill="none"/>`;
      break;
    case 'spiky':
      front = `<path d="M50 96L52 50L76 66L88 32L104 62L122 32L130 64L152 46L150 96Q100 58 50 96Z" fill="${G(hair)}" ${st(hair)}/>`;
      break;
    case 'short':
      front = `<path d="M48 98Q40 34 100 34Q160 34 152 98Q138 62 100 64Q62 62 48 98Z" fill="${G(hair)}" ${st(hair)}/>`;
      break;
    case 'cap':
      front = `<path d="M52 86Q52 34 100 34Q148 34 148 86Z" fill="${G(hatc)}" ${st(hatc)}/><path d="M42 86H158Q160 97 144 97H56Q40 97 42 86Z" fill="${shade(hatc, -0.2)}" ${st(hatc)}/><circle cx="100" cy="36" r="4.5" fill="${shade(hatc, -0.2)}"/>`;
      break;
    case 'pigtails':
      back = `<circle cx="100" cy="92" r="53" fill="${G(hair)}" ${st(hair)}/><circle cx="42" cy="96" r="19" fill="${G(hair)}" ${st(hair)}/><circle cx="158" cy="96" r="19" fill="${G(hair)}" ${st(hair)}/>`;
      front = fringe + `<circle cx="52" cy="78" r="5.5" fill="#ff5c7a"/><circle cx="148" cy="78" r="5.5" fill="#ff5c7a"/>`;
      break;
    case 'bun':
      back = `<circle cx="100" cy="32" r="20" fill="${G(hair)}" ${st(hair)}/><circle cx="100" cy="92" r="53" fill="${G(hair)}" ${st(hair)}/>`;
      front = fringe + `<rect x="86" y="46" width="28" height="6" rx="3" fill="#ff5c7a"/>`;
      break;
    case 'ponytail':
      back = `<path d="M138 60Q192 56 182 130Q168 100 140 104Z" fill="${G(hair)}" ${st(hair)}/><circle cx="100" cy="92" r="53" fill="${G(hair)}" ${st(hair)}/>`;
      front = fringe + `<circle cx="140" cy="64" r="5.5" fill="#ffd23c"/>`;
      break;
  }
  const browCol = c.hat === 'tudung' ? '#5a3a2a' : shade(hair, 0.1);
  const eye = (cx) => `<g class="eye"><ellipse cx="${cx}" cy="97" rx="6.8" ry="8.4" fill="#3b2519"/><circle cx="${cx - 2.2}" cy="93.5" r="2.8" fill="#fff"/><circle cx="${cx + 2.6}" cy="101" r="1.4" fill="#fff"/></g>`;
  const eyes = c.eyes === 'happy'
    ? `<path d="M72 100q10-13 20 0M108 100q10-13 20 0" stroke="${OL}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
    : eye(82) + eye(118);
  const glasses = c.glasses
    ? `<circle cx="82" cy="97" r="17" fill="rgba(255,255,255,.16)" stroke="${OL}" stroke-width="4"/><circle cx="118" cy="97" r="17" fill="rgba(255,255,255,.16)" stroke="${OL}" stroke-width="4"/><path d="M99 96h2" stroke="${OL}" stroke-width="4"/>`
      + (c.hat === 'tudung' ? '' : `<path d="M65 94L55 91M135 94L145 91" stroke="${OL}" stroke-width="3.5" stroke-linecap="round"/>`)
    : `<path d="M73 80q9-5 18 0M109 80q9-5 18 0" stroke="${browCol}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const face = `${ears}<circle cx="100" cy="92" r="47" fill="${G(skin)}" ${st(skin)}/>${eyes}${glasses}`
    + `<path d="M97 107q3 3 6 0" stroke="${shade(skin, -0.3)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="66" cy="113" rx="8.5" ry="5.5" fill="#ff7a93" opacity=".42"/><ellipse cx="134" cy="113" rx="8.5" ry="5.5" fill="#ff7a93" opacity=".42"/>`
    + `<path d="M90 115q10 12 20 0z" fill="#b3394a" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`;
  return back + face + front;
}

function charSVG(i, headOnly) {
  const c = CHARS[i] || CHARS[0];
  const pre = 'g' + (GRAD_SEQ++) + '_';
  const defs = [];
  const G = (color) => {
    const id = pre + defs.length;
    defs.push(`<radialGradient id="${id}" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="${shade(color, 0.32)}"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.22)}"/></radialGradient>`);
    return `url(#${id})`;
  };
  const vb = headOnly ? '28 20 144 144' : '0 0 200 252';
  const inner = (headOnly ? '' : charBody(c, G)) + charHead(c, G);
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs.join('')}</defs>${inner}</svg>`;
}
