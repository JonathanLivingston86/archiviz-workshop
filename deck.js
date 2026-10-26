/* ArchiViz workshop: motore del deck, quiz e visualizzazioni. Nessuna dipendenza esterna. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const body = document.body;
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (name, attrs = {}, parent) => {
  const el = document.createElementNS(SVGNS, name);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
};

/* ================= QUIZ ================= */
const QUIZ_N = 6;
const quiz = { order: [], sides: [], chosen: [], locked: [], score: 0 };
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function buildQuizSlides() {
  const slot = $('#quizSlot');
  const frag = document.createDocumentFragment();
  for (let r = 0; r < QUIZ_N; r++) {
    const s = document.createElement('section');
    s.className = 'slide dark';
    s.dataset.po = '';
    s.dataset.round = r;
    s.dataset.title = 'Quiz, round ' + (r + 1);
    s.innerHTML = `
      <div class="in dense">
        <div class="qhead"><p class="eyebrow">Round ${r + 1} di ${QUIZ_N}</p><div class="dots">${'<i></i>'.repeat(QUIZ_N)}</div></div>
        <div class="pair">
          <button class="card" data-side="A" aria-label="Immagine A"><img alt="Immagine A"><span class="lbl">A</span><span class="badge"></span></button>
          <button class="card" data-side="B" aria-label="Immagine B"><img alt="Immagine B"><span class="lbl">B</span><span class="badge"></span></button>
        </div>
        <p class="qfoot small">Quale è la foto vera? Clicca la risposta della classe (A o B).</p>
      </div>`;
    frag.appendChild(s);
  }
  slot.replaceWith(frag);
}

function quizReset() {
  quiz.order = shuffle([...Array(QUIZ_N).keys()]);
  quiz.sides = quiz.order.map(() => (Math.random() < .5 ? 'A' : 'B')); // lato della foto vera
  quiz.chosen = quiz.order.map(() => null);
  quiz.locked = quiz.order.map(() => false);
  quiz.score = 0;
  $$('[data-round]').forEach(s => {
    const r = +s.dataset.round, k = quiz.order[r] + 1, n = String(k).padStart(2, '0');
    const real = `quiz/${n}-reale.jpg`, ai = `quiz/${n}-ai.jpg`;
    const realSide = quiz.sides[r];
    const cards = $$('.card', s);
    cards.forEach(c => {
      c.classList.remove('sel', 'locked', 'reveal', 'is-real', 'is-ai', 'good', 'bad', 'missing');
      const side = c.dataset.side, isReal = side === realSide;
      const img = $('img', c);
      img.onload = () => { if (isReal) s.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4)); c.classList.remove('missing'); };
      img.onerror = () => c.classList.add('missing');
      img.removeAttribute('src');
      img.src = isReal ? real : ai;
      $('.badge', c).textContent = isReal ? 'FOTO VERA' : 'GENERATA DALL\'AI';
      c.classList.add(isReal ? 'is-real' : 'is-ai');
    });
    $$('.dots i', s).forEach((d, i) => { d.className = i === r ? 'cur' : ''; });
  });
  updateQuizEnd();
}

function chooseCard(slide, side) {
  const r = +slide.dataset.round;
  if (quiz.locked[r]) return;
  quiz.locked[r] = true; quiz.chosen[r] = side;
  const cards = $$('.card', slide);
  cards.forEach(c => c.classList.add('locked'));
  const chosen = cards.find(c => c.dataset.side === side);
  chosen.classList.add('sel');
  setTimeout(() => {
    const good = quiz.sides[r] === side;
    if (good) quiz.score++;
    cards.forEach(c => c.classList.add('reveal'));
    chosen.classList.add(good ? 'good' : 'bad');
    $('.qfoot', slide).textContent = good ? 'La classe ha indovinato.' : 'La classe ha scelto l\'immagine generata.';
    updateQuizEnd();
  }, 650);
}

function updateQuizEnd() {
  const done = quiz.chosen.filter(c => c).length;
  $('#quizScore').innerHTML = `${quiz.score}<span>/${QUIZ_N}</span>`;
  $$('[data-round]').forEach(s => {
    $$('.dots i', s).forEach((d, i) => {
      const r = +s.dataset.round;
      let cls = i === r ? 'cur' : '';
      if (i < QUIZ_N && quiz.chosen[i]) cls = (quiz.sides[i] === quiz.chosen[i]) ? 'ok' : 'ko';
      if (i === r && !quiz.chosen[i]) cls = 'cur';
      d.className = cls;
    });
  });
  return done;
}

/* ================= MOTORE DECK ================= */
let slides = [], cur = 0, step = 0, mode = 'presenter';
const maxStep = s => +(s.dataset.steps || 0);

function applySteps(slide, n) {
  $$('[data-step]', slide).forEach(e => e.classList.toggle('on', +e.dataset.step <= n));
  $$('[data-until]', slide).forEach(e => e.classList.toggle('off', n >= +e.dataset.until));
}

function visibleSlides() { return slides.filter(s => !(mode === 'handout' && s.hasAttribute('data-po'))); }

function show(i, st = 0) {
  const list = visibleSlides();
  cur = Math.max(0, Math.min(list.length - 1, i));
  const s = list[cur];
  slides.forEach(x => x.classList.remove('active'));
  s.classList.add('active');
  step = Math.max(0, Math.min(maxStep(s), st));
  applySteps(s, step);
  $('#progress').style.width = ((cur + 1) / list.length * 100) + '%';
  if (mode === 'presenter') history.replaceState(null, '', '#' + (cur + 1));
  onEnter(s);
}

function onEnter(s) {
  if (s.id === 'quizEnd') updateQuizEnd();
  if (s.querySelector('#pbrcv')) pbr.start();
  if (s.querySelector('#cmp')) upscale.draw();
  if (s.querySelector('#extvis')) ext.draw();
}

function next() {
  if (mode !== 'presenter') return;
  const s = visibleSlides()[cur];
  if (step < maxStep(s)) { step++; applySteps(s, step); onStep(s); return; }
  show(cur + 1);
}
function prev() {
  if (mode !== 'presenter') return;
  const s = visibleSlides()[cur];
  if (step > 0) { step--; applySteps(s, step); onStep(s); return; }
  if (cur > 0) { const p = visibleSlides()[cur - 1]; show(cur - 1, maxStep(p)); }
}
function onStep(s) {
  const cap = $('#inpcap');
  if (s.querySelector('#inpvis') && cap) cap.textContent = ['Un\'immagine che funziona quasi.', 'Selezioni solo il divano. Il resto è protetto.', 'Descrivi il cambiamento. Il resto non si tocca.'][step];
  if (s.querySelector('#flowvis')) flow.set(step);
}

function setMode(m) {
  mode = m;
  body.classList.toggle('presenter', m === 'presenter');
  body.classList.toggle('handout', m === 'handout');
  $('#bMode').textContent = m === 'presenter' ? 'Dispensa' : 'Presenta';
  $('#bFs').style.display = m === 'presenter' ? '' : 'none';
  $('#bIndex').style.display = m === 'presenter' ? '' : 'none';
  $('#bPrint').style.display = m === 'handout' ? '' : 'none';
  if (m === 'handout') {
    slides.forEach(s => { s.classList.remove('active'); applySteps(s, maxStep(s)); });
    $$('[data-until]').forEach(e => { /* stato finale */ });
    history.replaceState(null, '', '#dispensa');
    pbr.start(); upscale.draw(); ext.draw(); flow.set(5); onStepAll();
  } else {
    show(Math.min(cur, visibleSlides().length - 1));
  }
}
function onStepAll() { const cap = $('#inpcap'); if (cap) cap.textContent = 'Descrivi il cambiamento. Il resto non si tocca.'; }

function buildIndex() {
  const ol = $('#overlayList'); ol.innerHTML = '';
  visibleSlides().forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button><small>${i + 1}</small>${s.dataset.title || 'Slide'}</button>`;
    li.firstChild.onclick = () => { $('#overlay').classList.remove('open'); show(i); };
    ol.appendChild(li);
  });
}

/* ================= COPIA PROMPT ================= */
async function copyText(btn, text) {
  let ok = false;
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; } } catch (_) {}
  if (!ok) {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); try { ok = document.execCommand('copy'); } catch (_) {} ta.remove();
  }
  if (!ok) window.prompt('Copia il testo:', text);
  const old = btn.textContent; btn.textContent = ok ? 'Copiato' : 'Copia a mano'; btn.classList.toggle('done', ok);
  setTimeout(() => { btn.textContent = 'Copia'; btn.classList.remove('done'); }, 1400);
}

/* ================= VISUAL: CAMERA ================= */
const SHOTS = [
  { it: 'Campo totale', en: 'Establishing shot', f: 24, pos: [300, 352], dir: -90, kw: 'eye-level camera, 24-35 mm, wide interior, straight verticals', len: 250 },
  { it: 'Angolo architettonico', en: 'Two-point perspective', f: 28, pos: [64, 344], dir: -33, kw: 'corner camera position, 24-35 mm, two-point perspective, straight verticals', len: 270 },
  { it: 'Attraverso una soglia', en: 'Framed shot', f: 35, pos: [640, 290], dir: 180, kw: 'doorway framing, 35 mm, layered depth, interior transition', len: 260 },
  { it: 'Dall\'alto', en: 'High angle', f: 24, pos: [76, 66], dir: 33, kw: 'high camera position above eye level, tilted downward, 24-35 mm, furniture layout and proportions, even soft light', len: 250, note: 'camera in alto' },
  { it: 'Dettaglio architettonico', en: 'Close-up', f: 50, pos: [330, 300], dir: -90, kw: 'close-up detail, 50-85 mm, shallow depth, raking side light', len: 170 },
  { it: 'Macro materiale', en: 'Macro texture', f: 100, pos: [470, 146], dir: -90, kw: 'macro material, 85-100 mm macro, texture study, soft grazing light', len: 76 }
];
function initCamera() {
  const el = $('#camvis'); if (!el) return;
  el.innerHTML = '';
  // stanza e corridoio
  svg('rect', { x: 40, y: 40, width: 520, height: 320, class: 'room', rx: 2 }, el);
  svg('rect', { x: 560, y: 220, width: 100, height: 120, fill: '#f0f0f3', stroke: '#1d1d1f', 'stroke-width': 3 }, el);
  svg('rect', { x: 558, y: 240, width: 6, height: 70, fill: '#f5f5f7' }, el); // porta aperta
  svg('rect', { x: 160, y: 36, width: 150, height: 8, fill: '#8ec5f0' }, el); // finestra
  // arredi
  svg('rect', { x: 60, y: 160, width: 58, height: 118, rx: 8, fill: '#d6d6db' }, el);
  svg('rect', { x: 250, y: 190, width: 100, height: 60, rx: 4, fill: '#e3d8c4' }, el);
  svg('rect', { x: 400, y: 48, width: 140, height: 24, rx: 3, fill: '#d6d6db' }, el);
  svg('text', { x: 62, y: 154 }, el).textContent = 'divano';
  svg('text', { x: 272, y: 184 }, el).textContent = 'tavolo';
  svg('text', { x: 436, y: 90 }, el).textContent = 'libreria';
  const cones = [], cams = [];
  SHOTS.forEach((s, i) => {
    const half = Math.atan(18 / s.f);
    const a = s.dir * Math.PI / 180;
    const p1 = [s.pos[0] + Math.cos(a - half) * s.len, s.pos[1] + Math.sin(a - half) * s.len];
    const p2 = [s.pos[0] + Math.cos(a + half) * s.len, s.pos[1] + Math.sin(a + half) * s.len];
    const cone = svg('path', { d: `M${s.pos[0]} ${s.pos[1]} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z`, class: 'cone', opacity: 0 }, el);
    cones.push(cone);
  });
  SHOTS.forEach((s, i) => {
    const g = svg('g', { class: 'cam', transform: `translate(${s.pos[0]} ${s.pos[1]})` }, el);
    svg('circle', { r: 13, fill: 'inherit' }, g);
    svg('text', { y: 4, 'text-anchor': 'middle', style: 'fill:#fff;font-size:12px;font-weight:700' }, g).textContent = i + 1;
    g.addEventListener('click', () => pick(i));
    cams.push(g);
  });
  const tabs = $('#camtabs'); tabs.innerHTML = '';
  const btns = SHOTS.map((s, i) => { const b = document.createElement('button'); b.className = 'tab'; b.textContent = (i + 1) + ' ' + s.it; b.onclick = () => pick(i); tabs.appendChild(b); return b; });
  function pick(i) {
    const s = SHOTS[i];
    cones.forEach((c, k) => c.setAttribute('opacity', k === i ? 1 : 0));
    cams.forEach((c, k) => c.classList.toggle('on', k === i));
    btns.forEach((b, k) => b.setAttribute('aria-pressed', k === i));
    $('#camname').textContent = s.it;
    $('#camen').textContent = s.en;
    $('#camfocal').textContent = s.f + ' mm' + (s.note ? ' · ' + s.note : '');
    $('#camkw').textContent = s.kw;
  }
  pick(0);
}

/* ================= VISUAL: PBR ================= */
const pbr = (() => {
  let ready = false, raf = 0, mode = 3, lx = .35, ly = -.3, idle = true, W = 520, H = 320, cv, ctx, alb, hgt, rgh, nrm, running = false, t0 = 0;
  const rnd = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = rnd(xi, yi, s), b = rnd(xi + 1, yi, s), c = rnd(xi, yi + 1, s), d = rnd(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  function build() {
    cv = $('#pbrcv'); if (!cv) return; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    alb = new Float32Array(W * H * 3); hgt = new Float32Array(W * H); rgh = new Float32Array(W * H); nrm = new Float32Array(W * H * 3);
    const TW = 104, TH = 52, G = 5;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const row = Math.floor(y / TH), ox = (row % 2) * TW / 2, xx = x + ox, tx = Math.floor(xx / TW), lx_ = xx - tx * TW, ly_ = y - row * TH;
      const d = Math.min(lx_, TW - lx_, ly_, TH - ly_), inT = d >= G / 2, bev = Math.min(1, Math.max(0, (d - G / 2) / 7));
      const tv = rnd(tx, row, 3), n1 = vn(x * .08, y * .08, 1), n2 = vn(x * .5, y * .5, 2);
      const i = y * W + x;
      hgt[i] = (inT ? .55 + .45 * bev : 0) + (n1 - .5) * .05 + (n2 - .5) * .035;
      rgh[i] = inT ? .32 + .3 * n1 + .08 * n2 : .96;
      const k = i * 3;
      if (inT) { const v = (tv - .5) * 34 + (n1 - .5) * 24 + (n2 - .5) * 10; alb[k] = 192 + v; alb[k + 1] = 164 + v * .9; alb[k + 2] = 134 + v * .8; }
      else { alb[k] = 78 + n2 * 14; alb[k + 1] = 72 + n2 * 12; alb[k + 2] = 66 + n2 * 10; }
    }
    const S = 15;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x, gx = (hgt[i + 1] - hgt[i - 1]) * S, gy = (hgt[i + W] - hgt[i - W]) * S, l = Math.hypot(gx, gy, 1);
      nrm[i * 3] = -gx / l; nrm[i * 3 + 1] = -gy / l; nrm[i * 3 + 2] = 1 / l;
    }
    cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); lx = ((e.clientX - r.left) / r.width - .5) * 2; ly = ((e.clientY - r.top) / r.height - .5) * 2; idle = false; });
    cv.addEventListener('pointerleave', () => { idle = true; });
    const tabs = $('#pbrtabs');
    ['Colore', 'Rugosità', 'Rilievo', 'Risultato'].forEach((n, i) => { const b = document.createElement('button'); b.className = 'tab'; b.textContent = n; b.onclick = () => { mode = i; $$('button', tabs).forEach((x, k) => x.setAttribute('aria-pressed', k === i)); }; tabs.appendChild(b); });
    $$('button', tabs)[3].setAttribute('aria-pressed', 'true');
    ready = true;
  }
  function frame(t) {
    raf = 0; if (!cv || !cv.isConnected) return;
    const vis = body.classList.contains('handout') || cv.closest('.slide').classList.contains('active');
    if (!vis) { running = false; return; }
    if (idle) { const a = t / 2200; lx = Math.cos(a) * .75; ly = Math.sin(a * .8) * .55 - .15; }
    const img = ctx.createImageData(W, H), d = img.data;
    let L0 = -lx, L1 = -ly, L2 = .62; const ll = Math.hypot(L0, L1, L2); L0 /= ll; L1 /= ll; L2 /= ll;
    const H0 = L0, H1 = L1, H2 = L2 + 1, hl = Math.hypot(H0, H1, H2);
    for (let i = 0, p = 0; i < W * H; i++, p += 4) {
      const k = i * 3; let r, g, b;
      if (mode === 0) { r = alb[k]; g = alb[k + 1]; b = alb[k + 2]; }
      else if (mode === 1) { r = g = b = (1 - rgh[i]) * 255; }
      else if (mode === 2) { r = (nrm[k] * .5 + .5) * 255; g = (nrm[k + 1] * .5 + .5) * 255; b = (nrm[k + 2] * .5 + .5) * 255; }
      else {
        const nd = Math.max(0, nrm[k] * L0 + nrm[k + 1] * L1 + nrm[k + 2] * L2), nh = Math.max(0, (nrm[k] * H0 + nrm[k + 1] * H1 + nrm[k + 2] * H2) / hl);
        const sh = (1 - rgh[i]), sp = Math.pow(nh, 18 + sh * 90) * sh * 150, lit = .22 + .95 * nd;
        r = alb[k] * lit + sp; g = alb[k + 1] * lit + sp; b = alb[k + 2] * lit + sp;
      }
      d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    raf = requestAnimationFrame(frame);
  }
  return { start() { if (!ready) build(); if (!cv) return; if (!raf) { running = true; raf = requestAnimationFrame(frame); } } };
})();

/* ================= VISUAL: MOODBOARD ================= */
function initMood() {
  const sw = $('#moodsw'); if (!sw) return;
  const items = [
    { id: 'calce', n: 'Intonaco a calce', hex: '#e9e2d4', en: 'lime plaster walls' },
    { id: 'rovere', n: 'Rovere naturale', hex: '#c8a06a', en: 'natural oak' },
    { id: 'terracotta', n: 'Terracotta', hex: '#b8603f', en: 'terracotta' },
    { id: 'ottone', n: 'Ottone spazzolato', hex: '#c9a14a', en: 'brushed brass' },
    { id: 'salvia', n: 'Verde salvia', hex: '#9cae94', en: 'sage green paint' },
    { id: 'travertino', n: 'Travertino', hex: '#d8cbb2', en: 'travertine' },
    { id: 'lino', n: 'Lino grezzo', hex: '#cdbfa6', en: 'raw linen' },
    { id: 'nero', n: 'Acciaio nero opaco', hex: '#2b2b2d', en: 'matte black steel' }
  ];
  const tex = {
    rovere: 'repeating-linear-gradient(90deg,rgba(60,35,10,.35) 0 1px,transparent 1px 7px)',
    terracotta: 'linear-gradient(rgba(60,20,10,.4) 1px,transparent 1px) 0 0/100% 50%,linear-gradient(90deg,rgba(60,20,10,.4) 1px,transparent 1px) 0 0/50% 100%',
    ottone: 'repeating-linear-gradient(105deg,rgba(255,255,255,.35) 0 2px,transparent 2px 6px)',
    lino: 'repeating-linear-gradient(0deg,rgba(80,60,30,.25) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(80,60,30,.25) 0 1px,transparent 1px 4px)',
    travertino: 'repeating-linear-gradient(0deg,rgba(120,100,70,.28) 0 2px,transparent 2px 11px)',
    calce: 'radial-gradient(rgba(120,110,90,.22) 1px,transparent 1.4px) 0 0/5px 5px'
  };
  let sel = ['calce', 'rovere', 'terracotta', 'ottone', 'salvia'];
  const ids = items.map(i => i.id);
  items.forEach(it => {
    const b = document.createElement('button'); b.className = 'chip'; b.dataset.id = it.id;
    b.innerHTML = `<i style="background:${it.hex}"></i>${it.n}`;
    b.onclick = () => { if (sel.includes(it.id)) sel = sel.filter(x => x !== it.id); else if (sel.length < 5) sel.push(it.id); render(); };
    sw.appendChild(b);
  });
  function render() {
    $$('.chip', sw).forEach(c => c.setAttribute('aria-pressed', sel.includes(c.dataset.id)));
    const board = $('#moodboard'); board.innerHTML = '';
    const spans = [[4, 3], [2, 2], [2, 1], [3, 2], [3, 1]];
    sel.forEach((id, k) => {
      const it = items.find(x => x.id === id), d = document.createElement('div');
      const sp = spans[k] || [2, 1];
      d.style.gridColumn = `span ${sp[0]}`; d.style.gridRow = `span ${sp[1]}`; d.style.background = it.hex;
      d.style.color = ['nero', 'terracotta'].includes(id) ? '#fff' : '#1d1d1f';
      d.style.setProperty('--tx', tex[id] || 'none'); d.innerHTML = `<span>${it.n}</span>`;
      board.appendChild(d);
    });
    const list = sel.map(id => items.find(x => x.id === id));
    $('#moodout').textContent = list.length
      ? `Style: calm, tactile, warm, editorial.\nPalette: ${list.map(i => i.en + ' ' + i.hex).join(', ')}.\nMaterials: ${list.map(i => i.en).join(', ')}.\nLight: soft natural daylight.\nMandatory: use only this palette and these materials.\nForbidden: any other color or material.`
      : 'Scegli almeno un materiale.';
  }
  render();
}

/* ================= VISUAL: UPSCALE ================= */
const upscale = (() => {
  let drawn = false;
  function facade(c) {
    const x = c.getContext('2d'), w = c.width, h = c.height;
    const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9ec5e6'); sky.addColorStop(1, '#e9eef2'); x.fillStyle = sky; x.fillRect(0, 0, w, h);
    x.fillStyle = '#b4684a'; x.fillRect(110, 40, 780, 420);
    x.strokeStyle = 'rgba(70,30,15,.55)'; x.lineWidth = 1;
    for (let y = 40; y < 460; y += 10) { x.beginPath(); x.moveTo(110, y); x.lineTo(890, y); x.stroke(); }
    for (let r = 0; r < 42; r++) for (let X = 110 + (r % 2) * 10; X < 890; X += 20) { x.beginPath(); x.moveTo(X, 40 + r * 10); x.lineTo(X, 50 + r * 10); x.stroke(); }
    x.fillStyle = '#f2ead9'; x.fillRect(100, 30, 800, 16);
    for (let c2 = 0; c2 < 4; c2++) for (let r = 0; r < 2; r++) {
      const X = 170 + c2 * 180, Y = 90 + r * 140;
      x.fillStyle = '#f2ead9'; x.fillRect(X - 8, Y - 8, 116, 116);
      x.fillStyle = '#6e8da3'; x.fillRect(X, Y, 100, 100);
      x.strokeStyle = '#f2ead9'; x.lineWidth = 3; x.beginPath(); x.moveTo(X + 50, Y); x.lineTo(X + 50, Y + 100); x.moveTo(X, Y + 50); x.lineTo(X + 100, Y + 50); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(X + 8, Y + 40); x.lineTo(X + 42, Y + 8); x.stroke();
    }
    x.fillStyle = '#2f2f31'; x.fillRect(110, 380, 780, 80);
    x.fillStyle = '#d9c9a3'; x.fillRect(150, 392, 70, 68);
    x.fillStyle = '#9ec5e6'; x.fillRect(250, 392, 260, 60); x.fillRect(560, 392, 260, 60);
    x.strokeStyle = '#2f2f31'; x.lineWidth = 2; for (let X = 250; X <= 510; X += 26) { x.beginPath(); x.moveTo(X, 392); x.lineTo(X, 452); x.stroke(); }
    for (let X = 560; X <= 820; X += 26) { x.beginPath(); x.moveTo(X, 392); x.lineTo(X, 452); x.stroke(); }
    x.fillStyle = '#f7f1e3'; x.font = '700 22px Georgia, serif'; x.fillText('CAFFÈ  1962', 330, 372);
    x.strokeStyle = '#2f2f31'; x.lineWidth = 2; for (let X = 170; X < 810; X += 9) { x.beginPath(); x.moveTo(X, 300); x.lineTo(X, 330); x.stroke(); }
    x.beginPath(); x.moveTo(160, 300); x.lineTo(820, 300); x.moveTo(160, 330); x.lineTo(820, 330); x.stroke();
    x.fillStyle = '#4f7a49'; x.beginPath(); x.arc(60, 340, 60, 0, 7); x.fill(); x.fillStyle = '#6b4a33'; x.fillRect(56, 340, 8, 120);
    x.fillStyle = '#c9c4ba'; x.fillRect(0, 458, w, 2);
    x.fillStyle = '#d6d2c8'; x.fillRect(0, 460, w, 10);
  }
  function draw() {
    const hi = $('#cmpHigh'), lo = $('#cmpLow'); if (!hi || !lo) return;
    if (!drawn) {
      facade(hi);
      const t = document.createElement('canvas'); t.width = 100; t.height = 46; t.getContext('2d').drawImage(hi, 0, 0, 100, 46);
      const x = lo.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, 1000, 460);
      const box = $('#cmp'); let drag = false;
      const move = e => { const r = box.getBoundingClientRect(); let p = ((e.clientX - r.left) / r.width) * 100; p = Math.max(2, Math.min(98, p)); $('.top', box).style.clipPath = `inset(0 0 0 ${p}%)`; $('.bar', box).style.left = p + '%'; };
      box.addEventListener('pointerdown', e => { drag = true; box.setPointerCapture(e.pointerId); move(e); });
      box.addEventListener('pointermove', e => { if (drag) move(e); });
      box.addEventListener('pointerup', () => { drag = false; });
      drawn = true;
    }
  }
  return { draw };
})();

/* ================= VISUAL: DA PIANTA A VOLUME ================= */
const ext = (() => {
  let ready = false, el, range;
  const S = 46, C = Math.cos(Math.PI / 6), SN = .5;
  const boxes = [
    { n: 'w', x0: 0, y0: 0, x1: 6, y1: .16, h: 2.7, c: '#f1efe9' },
    { n: 'w', x0: 0, y0: 0, x1: .16, y1: 4, h: 2.7, c: '#f1efe9' },
    { n: 'w', x0: 0, y0: 3.84, x1: 6, y1: 4, h: 2.7, c: '#f1efe9' },
    { n: 'w', x0: 5.84, y0: 0, x1: 6, y1: 4, h: 2.7, c: '#f1efe9' },
    { n: 'w', x0: 3.6, y0: 0, x1: 3.76, y1: 1.9, h: 2.7, c: '#f1efe9' },
    { n: 'w', x0: 3.6, y0: 2.9, x1: 3.76, y1: 4, h: 2.7, c: '#f1efe9' },
    { n: 'f', x0: .4, y0: 1.2, x1: 1.15, y1: 2.8, h: .8, c: '#8fb3a8' },
    { n: 'f', x0: 1.8, y0: 1.3, x1: 2.8, y1: 2.2, h: .75, c: '#d9bf94' },
    { n: 'f', x0: 4.3, y0: 2.4, x1: 5.7, y1: 3.7, h: .55, c: '#c47a5a' },
    { n: 'f', x0: 4.2, y0: .2, x1: 5.7, y1: .7, h: 2, c: '#d9bf94' }
  ];
  const P = (x, y, z) => [320 + (x - y) * C * S - 40, 126 + (x + y) * SN * S - z * S];
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  function draw() {
    if (!ready) { el = $('#extvis'); range = $('#extrange'); if (!el) return; range.addEventListener('input', draw); ready = true; }
    const t = range.value / 100; el.innerHTML = '';
    const floor = [P(0, 0, 0), P(6, 0, 0), P(6, 4, 0), P(0, 4, 0)].map(p => p.join(',')).join(' ');
    svg('polygon', { points: floor, fill: '#e6d9c3', stroke: '#c9b99b', 'stroke-width': 1 }, el);
    for (let i = 1; i < 12; i++) { const a = P(i * .5, 0, 0), b = P(i * .5, 4, 0); svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#d3c3a5', 'stroke-width': .6 }, el); }
    for (let j = 1; j < 8; j++) { const a = P(0, j * .5, 0), b = P(6, j * .5, 0); svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#d3c3a5', 'stroke-width': .6 }, el); }
    [...boxes].sort((a, b) => (a.x1 + a.y1) - (b.x1 + b.y1)).forEach(bx => {
      const z = bx.h * t;
      const A = P(bx.x0, bx.y0, z), B = P(bx.x1, bx.y0, z), Cc = P(bx.x1, bx.y1, z), D = P(bx.x0, bx.y1, z);
      const Bb = P(bx.x1, bx.y0, 0), Cb = P(bx.x1, bx.y1, 0), Db = P(bx.x0, bx.y1, 0);
      const pts = a => a.map(p => p.join(',')).join(' ');
      if (z > .001) {
        svg('polygon', { points: pts([D, Cc, Cb, Db]), fill: shade(bx.c, .86) }, el);
        svg('polygon', { points: pts([B, Cc, Cb, Bb]), fill: shade(bx.c, .7) }, el);
      }
      svg('polygon', { points: pts([A, B, Cc, D]), fill: shade(bx.c, 1), stroke: t < .02 ? '#1d1d1f' : 'rgba(0,0,0,.12)', 'stroke-width': t < .02 ? 2 : 1 }, el);
    });
  }
  return { draw };
})();

/* ================= VISUAL: FLUSSO AGENTIC 3D ================= */
const flow = (() => {
  let built = false, nodes = [], arrows = [], loop;
  const labels = [['Brief, pianta', 'o schizzo'], ['Scheda', 'del progetto'], ['Motore', 'geometria e norme'], ['SketchUp', 'modello dal vivo'], ['Rapporto', 'cosa è stato fatto']];
  function build() {
    const el = $('#flowvis'); if (!el) return; el.innerHTML = '';
    const defs = svg('defs', {}, el);
    const m = svg('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    svg('path', { d: 'M0 0L10 5L0 10z', fill: '#0071e3' }, m);
    const w = 150, gap = 37, y = 80, h = 92;
    labels.forEach((l, i) => {
      const x = 12 + i * (w + gap);
      const g = svg('g', i === 0 ? { class: 'node' } : { 'data-step': i, class: 'node' }, el);
      svg('rect', { x, y, width: w, height: h, rx: 18, fill: i === 0 ? '#f5f5f7' : '#fff', stroke: '#d2d2d7', 'stroke-width': 1.5 }, g);
      svg('text', { x: x + w / 2, y: y + 40, 'text-anchor': 'middle', style: 'font-size:19px;font-weight:700;fill:#1d1d1f' }, g).textContent = l[0];
      svg('text', { x: x + w / 2, y: y + 66, 'text-anchor': 'middle', style: 'font-size:13px;fill:#6e6e73' }, g).textContent = l[1];
      svg('text', { x: x + 14, y: y - 12, style: 'font-size:13px;font-weight:700;fill:#0071e3' }, g).textContent = i + 1;
      nodes.push(g);
      if (i < labels.length - 1) {
        const a = svg('line', { x1: x + w + 6, y1: y + h / 2, x2: x + w + gap - 6, y2: y + h / 2, stroke: '#0071e3', 'stroke-width': 2.5, 'marker-end': 'url(#ah)', 'data-step': i + 1 }, el);
        arrows.push(a);
      }
    });
    // il tuo agente
    const ag = svg('g', {}, el);
    svg('rect', { x: 12, y: 8, width: 876, height: 34, rx: 17, fill: '#0071e3', opacity: .1 }, ag);
    svg('text', { x: 450, y: 31, 'text-anchor': 'middle', style: 'font-size:15px;font-weight:600;fill:#0071e3' }, ag).textContent = 'Il tuo agente scrive, legge e corregge';
    // anello di ritorno
    loop = svg('path', { d: 'M 810 178 C 810 250, 270 250, 270 178', fill: 'none', stroke: '#0071e3', 'stroke-width': 2.2, 'stroke-dasharray': '6 6', 'marker-end': 'url(#ah)', 'data-step': 5 }, el);
    svg('text', { x: 540, y: 262, 'text-anchor': 'middle', style: 'font-size:14px;fill:#0071e3;font-weight:600' }, el).setAttribute('data-step', 5);
    el.lastChild.textContent = 'L\'agente rilegge il rapporto e corregge';
    built = true;
  }
  function set() { /* gli step sono gestiti dal motore tramite data-step */ }
  return { set, build };
})();

/* ================= AVVIO ================= */
function init() {
  buildQuizSlides();
  slides = $$('#deck > .slide');
  quizReset();
  initCamera(); initMood(); flow.build();
  // eventi quiz
  slides.filter(s => s.dataset.round !== undefined).forEach(s => $$('.card', s).forEach(c => c.addEventListener('click', () => chooseCard(s, c.dataset.side))));
  $('#quizReplay').onclick = () => { quizReset(); const first = visibleSlides().findIndex(s => s.dataset.round === '0'); show(Math.max(0, first - 1)); };
  // copia
  document.addEventListener('click', e => {
    const b = e.target.closest('.copy'); if (!b) return;
    const src = b.dataset.copyFrom ? document.getElementById(b.dataset.copyFrom) : $('pre', b.parentElement);
    copyText(b, src.textContent);
  });
  // UI
  $('#bMode').onclick = () => setMode(mode === 'presenter' ? 'handout' : 'presenter');
  $('#bIndex').onclick = () => { buildIndex(); $('#overlay').classList.add('open'); };
  $('#overlay').onclick = e => { if (e.target.id === 'overlay') $('#overlay').classList.remove('open'); };
  $('#bFs').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); };
  $('#bPrint').onclick = () => window.print();
  // tastiera
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    if ($('#overlay').classList.contains('open')) { if (e.key === 'Escape' || e.key.toLowerCase() === 'g') $('#overlay').classList.remove('open'); return; }
    const k = e.key;
    if (mode === 'presenter') {
      const s = visibleSlides()[cur];
      if (s && s.dataset.round !== undefined && (k.toLowerCase() === 'a' || k.toLowerCase() === 'b')) { chooseCard(s, k.toUpperCase()); return; }
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
      else if (k === 'Home') show(0);
      else if (k === 'End') show(visibleSlides().length - 1);
    }
    if (k.toLowerCase() === 'g' && mode === 'presenter') { buildIndex(); $('#overlay').classList.add('open'); }
    if (k.toLowerCase() === 'h') setMode(mode === 'presenter' ? 'handout' : 'presenter');
    if (k.toLowerCase() === 'f' && mode === 'presenter') $('#bFs').click();
  });
  // tocco e mouse
  let sx = 0, sy = 0;
  document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => { if (mode !== 'presenter') return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)(); }, { passive: true });
  document.addEventListener('click', e => {
    if (mode !== 'presenter' || e.target.closest('button,a,input,.cmp,.ui,.overlay,canvas,svg .cam,.tab,.chip,.copy,.prompt')) return;
    const x = e.clientX / window.innerWidth; if (x > .5) next(); else if (x < .2) prev();
  });
  window.addEventListener('hashchange', () => {
    const v = location.hash.replace('#', '');
    if (v === 'dispensa') { if (mode !== 'handout') setMode('handout'); }
    else if (/^\d+$/.test(v)) { if (mode !== 'presenter') setMode('presenter'); if (+v - 1 !== cur) show(+v - 1); }
  });
  let hideT; document.addEventListener('mousemove', () => { body.classList.add('ui-on'); clearTimeout(hideT); hideT = setTimeout(() => body.classList.remove('ui-on'), 2200); });
  // modalità iniziale
  const h = location.hash.replace('#', '');
  const small = window.innerWidth < 900;
  if (h === 'dispensa' || (small && !/^\d+$/.test(h))) { mode = 'handout'; body.classList.replace('presenter', 'handout'); setMode('handout'); }
  else { mode = 'presenter'; setMode('presenter'); const n = parseInt(h, 10); show(isNaN(n) ? 0 : n - 1); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
