(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  const DATA = window.KIDA_DATA;
  const STORE_KEY = 'kida:v1';
  const INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120, 240]; // days until next review, by stage
  const KNOWN_STAGE = 2;        // "known" once it's remembered on a later day
  const MIN_QUOTA = 5, MAX_QUOTA = 20;
  const REVIEW_CAP = 30;        // reviews per normal session
  const EASY_CAP = 15;          // reviews per easy-mode session
  const PAUSE_FACTOR = 8;       // pause new words when due reviews > quota * this
  const ANSWER_LOCK_MS = 450;   // brief pause before answers can be tapped
  const HAS_KANJI = /[㐀-鿿]/;

  const TIERS = [
    { min: 5, name: '', label: 'Normal pace' },
    { min: 8, name: 'Boost', label: 'Boost' },
    { min: 12, name: 'Aura', label: 'Aura' },
    { min: 16, name: 'Beast Mode', label: 'Beast Mode' },
  ];
  const DONE_LINES = [
    'Everything in its right place.',
    'Alright.',
    'Superunknown → known.',
    'OK. Done for today.',
    'That’s the day. Nice.',
  ];

  // ---------------------------------------------------------------------------
  // Storage (progress lives only on this device)
  // ---------------------------------------------------------------------------
  function defaults() {
    return {
      v: 1,
      settings: { quota: MIN_QUOTA, kanjiPerDay: 2, autoplay: true, readings: true, kanjiWrite: false, unit: null },
      items: {},      // id -> { s: stage, due: dayNumber, miss: count, seen: count }
      days: {},       // dayNumber -> { nw: new words, nk: new kanji, rv: reviews }
      placement: {},  // "year|unit" -> true once checked
      introDone: false,
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.v === 1) {
        const d = defaults();
        return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings) });
      }
    } catch (e) { /* private mode or corrupt data: start fresh */ }
    return defaults();
  }
  let S = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  function today() {
    const d = new Date();
    return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
  }
  function dayRec(t = today()) {
    if (!S.days[t]) S.days[t] = { nw: 0, nk: 0, rv: 0 };
    return S.days[t];
  }

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------
  const unitKey = u => u.split('-').map(Number);
  const cmpUnit = (a, b) => { const x = unitKey(a), y = unitKey(b); return (x[0] - y[0]) || (x[1] - y[1]); };
  const norm = s => (s || '').replace(/[\s　]/g, '');

  const BY_ID = new Map();
  const WORDS = [];           // de-duplicated words, one card per word
  (() => {
    const byKey = new Map();
    for (const w of DATA.words) {
      const key = norm(w.r || w.jp);
      const first = byKey.get(key);
      if (first) {
        // Same word taught again in a later year: keep one card, prefer the kanji spelling.
        first.also.push(w.y);
        if (w.y === 3 && !first.u3) first.u3 = w.u;
        if (!HAS_KANJI.test(first.jp) && HAS_KANJI.test(w.jp)) { first.jp = w.jp; first.r = w.r; }
        continue;
      }
      const card = Object.assign({ kind: 'w', also: [] }, w);
      byKey.set(key, card);
      WORDS.push(card);
      BY_ID.set(card.id, card);
    }
    // Japanese 1 and 2 words that Japanese 3 builds on go to the front of the catch-up line.
    const j3 = new Set();
    for (const w of DATA.words) if (w.y === 3) j3.add(norm(w.r || w.jp));
    for (const k of DATA.kanji) if (k.y === 3) for (const e of k.ex) j3.add(norm(e.r));
    for (const w of WORDS) w.link3 = w.y < 3 && (w.also.includes(3) || j3.has(norm(w.r || w.jp)));
  })();
  // Verbs carry whole sentences, so they're introduced first and reviewed more often.
  for (const w of WORDS) w.verb = /^\(?(to|gives?)\s/i.test(w.en) || /ています$/.test(w.jp);
  const VERB_INTERVAL = 0.6;

  const KANJI = DATA.kanji.map(k => Object.assign({ kind: 'k' }, k));
  KANJI.forEach(k => BY_ID.set(k.id, k));

  const wordsInUnit = (y, u) => WORDS.filter(w => (w.y === y && w.u === u) || (y === 3 && w.u3 === u));
  const J3_UNITS =[...new Set(WORDS.filter(w => w.y === 3).map(w => w.u))].sort(cmpUnit);
  const currentUnit = () => (S.settings.unit && J3_UNITS.includes(S.settings.unit)) ? S.settings.unit : J3_UNITS[J3_UNITS.length - 1];

  function wordRank(w) {
    const cu = currentUnit();
    const u3 = w.y === 3 ? w.u : w.u3; // older words re-taught in Japanese 3 count as that unit
    if (u3) return u3 === cu ? 0 : (cmpUnit(u3, cu) < 0 ? 1 : 2);
    if (w.link3) return 3;
    return 3 + w.y; // Japanese 1, then Japanese 2
  }
  function newQueue(kind) {
    if (kind === 'w') {
      return WORDS.filter(w => !S.items[w.id])
        .map((w, i) => ({ w, i, r: wordRank(w) }))
        .sort((a, b) => (a.r - b.r) || (b.w.verb - a.w.verb) || (a.w.y - b.w.y) || cmpUnit(a.w.u, b.w.u) || (a.i - b.i))
        .map(x => x.w);
    }
    const order = { 3: 0, 2: 1, 1: 2 };
    return KANJI.map((k, i) => ({ k, i })).filter(x => !S.items[x.k.id])
      .sort((a, b) => (order[a.k.y] - order[b.k.y]) || (a.i - b.i)).map(x => x.k);
  }
  function dueList(kind) {
    const t = today();
    return Object.keys(S.items)
      .filter(id => BY_ID.has(id) && BY_ID.get(id).kind === kind && S.items[id].due <= t)
      .sort((a, b) => S.items[a].due - S.items[b].due)
      .map(id => BY_ID.get(id));
  }
  function plan(kind, easy) {
    const due = dueList(kind);
    const quota = kind === 'w' ? S.settings.quota : S.settings.kanjiPerDay;
    const used = kind === 'w' ? dayRec().nw : dayRec().nk;
    const paused = due.length > quota * PAUSE_FACTOR;
    const newCount = (easy || paused) ? 0 : Math.max(0, quota - used);
    return {
      reviews: due.slice(0, easy ? EASY_CAP : REVIEW_CAP),
      news: newQueue(kind).slice(0, newCount),
      dueTotal: due.length,
      paused,
    };
  }
  const stageOf = it => (S.items[it.id] ? S.items[it.id].s : 0);
  const knownCount = kind => Object.keys(S.items).filter(id => BY_ID.has(id) && BY_ID.get(id).kind === kind && S.items[id].s >= KNOWN_STAGE).length;
  const learningCount = kind => Object.keys(S.items).filter(id => BY_ID.has(id) && BY_ID.get(id).kind === kind && S.items[id].s < KNOWN_STAGE).length;
  const minutes = p => Math.max(2, Math.round(p.reviews.length * 0.15 + p.news.length * 1.1));

  // ---------------------------------------------------------------------------
  // Scheduling
  // ---------------------------------------------------------------------------
  function introduce(item, counts = true) {
    S.items[item.id] = { s: 1, due: today() + INTERVALS[1], miss: 0, seen: 1 };
    if (counts) dayRec()[item.kind === 'w' ? 'nw' : 'nk']++;
  }
  function grade(item, correct) {
    const it = S.items[item.id];
    if (!it) return;
    const t = today();
    it.seen = (it.seen || 0) + 1;
    if (correct) {
      if (it.due > t) return; // extra practice before it was due: no schedule change
      it.s = Math.min(it.s + 1, INTERVALS.length - 1);
      const days = INTERVALS[it.s];
      it.due = t + (item.verb ? Math.max(1, Math.round(days * VERB_INTERVAL)) : days);
    } else {
      it.miss = (it.miss || 0) + 1;
      it.s = 1;
      it.due = t + 1;
    }
  }

  // ---------------------------------------------------------------------------
  // Audio (the phone's built-in Japanese voice)
  // ---------------------------------------------------------------------------
  let jaVoice = null;
  const canSpeak = 'speechSynthesis' in window;
  function pickVoice() {
    if (!canSpeak) return;
    const vs = speechSynthesis.getVoices();
    jaVoice = vs.find(v => /^ja([-_]|$)/i.test(v.lang)) || null;
    // Voices load late on Android; refresh the status line if it's on screen.
    const msg = document.getElementById('voice-msg');
    if (msg) msg.textContent = jaVoice ? `Using: ${jaVoice.name}. Tap the speaker to hear “こんにちは”.` : voiceHelp();
  }
  if (canSpeak) { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function speechText(s) {
    return (s || '')
      .replace(/[（(][^)）]*[)）]?/g, '')
      .split(/[\/／]/)[0]
      .replace(/[〜~]/g, '')
      .trim();
  }
  let currentUtterance = null; // keep a reference: Chrome can drop utterances that get garbage-collected
  function speak(text, onError) {
    if (!canSpeak) { if (onError) onError('This browser has no speech support.'); return; }
    const t = speechText(text);
    if (!t) return;
    if (!jaVoice) pickVoice();
    const go = () => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'ja-JP';
      if (jaVoice) u.voice = jaVoice;
      u.rate = 0.9;
      u.onend = () => { if (currentUtterance === u) currentUtterance = null; };
      u.onerror = e => { if (onError && e.error !== 'interrupted' && e.error !== 'canceled') onError(e.error); };
      currentUtterance = u;
      speechSynthesis.speak(u);
      if (speechSynthesis.paused) speechSynthesis.resume();
    };
    // On Android, speaking right after cancel() is often silently dropped, so wait a beat.
    if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(go, 120); }
    else go();
  }
  function testVoice() {
    const msg = document.getElementById('voice-msg');
    const all = canSpeak ? speechSynthesis.getVoices() : [];
    if (msg) msg.textContent = jaVoice
      ? `Using: ${jaVoice.name}. Playing “こんにちは”… (make sure media volume is up)`
      : `No Japanese voice found (${all.length} voices on this device). ${voiceHelp()}`;
    speak('こんにちは', err => { if (msg) msg.textContent = `The voice didn’t play (${err}). ${voiceHelp()}`; });
  }
  const sayWord = w => speak(w.r || w.jp);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const $app = document.getElementById('app');
  const $nav = document.getElementById('nav');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const showReading = w => S.settings.readings && w.r && w.r !== w.jp;
  const clean = s => (s || '').replace(/^-$/, '').trim();
  function tierFor(q) { let t = TIERS[0]; for (const x of TIERS) if (q >= x.min) t = x; return t; }
  const tierMinutes = q => Math.round(q * 1.3 + 3);

  function pickDistractors(item, pool, text, n = 3) {
    const want = text(item);
    const used = new Set([norm(want).toLowerCase()]);
    const same = shuffle(pool.filter(p => p !== item && p.y === item.y));
    const rest = shuffle(pool.filter(p => p !== item && p.y !== item.y));
    const out = [];
    for (const p of same.concat(rest)) {
      const t = text(p);
      const k = norm(t).toLowerCase();
      if (!t || used.has(k)) continue;
      used.add(k); out.push(p);
      if (out.length === n) break;
    }
    return out;
  }

  // ---------------------------------------------------------------------------
  // Views: tabs
  // ---------------------------------------------------------------------------
  let tab = 'home';
  let session = null;

  function setNav(visible) {
    $nav.hidden = !visible;
    document.body.classList.toggle('in-session', !visible);
    $nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  }
  $nav.addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    render();
    window.scrollTo(0, 0);
  });

  function render() {
    if (session) return renderSession();
    if (!S.introDone) return renderIntro();
    setNav(true);
    ({ home: renderHome, kanji: renderKanji, unknown: renderUnknown, settings: renderSettings })[tab]();
  }

  function brand() {
    return `<div class="brand"><img src="icons/icon-192.png" alt=""><div class="name">Kid <span class="jp">あ</span></div></div>`;
  }

  function weekDots() {
    const t = today();
    const dow = (new Date().getDay() + 6) % 7; // Monday = 0
    const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let html = '<div class="week">';
    for (let i = 0; i < 7; i++) {
      const d = t - dow + i;
      const r = S.days[d];
      const on = r && (r.nw + r.nk + r.rv) > 0;
      html += `<span><i class="${on ? 'on' : ''} ${d === t ? 'today' : ''}"></i>${names[i]}</span>`;
    }
    return html + '</div>';
  }

  function renderIntro() {
    setNav(false);
    const voiceOk = !!jaVoice;
    $app.innerHTML = `
      ${brand()}
      <h1>Hey.</h1>
      <p class="muted">A few minutes a day on the Japanese 1–3 vocab and kanji from class. Here’s how it works:</p>
      <div class="card stack">
        <div><b>Tap Start.</b> That’s it. The app picks what to study.</div>
        <div><b>A few new words a day.</b> You choose how many (5 is the minimum).</div>
        <div><b>Words come back right before you’d forget them.</b> That’s how they stick.</div>
      </div>
      <div class="card">
        <div class="row between"><b>Japanese voice</b><button class="speak" id="test-voice" aria-label="Test voice">🔊</button></div>
        <p class="faint" id="voice-msg">${voiceOk ? 'Tap the speaker. You should hear “こんにちは”.' : voiceHelp()}</p>
      </div>
      <div class="card">
        <h2>Already know some Japanese 1 and 2 words?</h2>
        <p class="muted">A quick check skips words you already know, so you don’t study them from scratch. About 4 questions per unit, and you can stop any time.</p>
        <button class="btn primary" id="go-check">Quick check</button>
        <button class="btn ghost" id="go-fresh">Skip for now</button>
      </div>`;
    $app.querySelector('#test-voice').onclick = testVoice;
    $app.querySelector('#go-check').onclick = () => { S.introDone = true; save(); startPlacement(1); };
    $app.querySelector('#go-fresh').onclick = () => { S.introDone = true; save(); render(); };
  }

  function voiceHelp() {
    return 'No Japanese voice found. On Android: Settings → System → Languages → Text-to-speech output → Speech Services by Google → Install voice data → Japanese. The app still works without it.';
  }

  function renderHome() {
    const p = plan('w', false);
    const kp = plan('k', false);
    const known = knownCount('w');
    const learning = learningCount('w');
    const nothing = !p.reviews.length && !p.news.length;
    const tier = tierFor(S.settings.quota);
    let startLabel;
    if (nothing) {
      startLabel = `<div class="card" style="text-align:center"><div class="big-num">✓</div><p style="margin-top:8px"><b>Done for today.</b></p><p class="muted">Come back tomorrow, or get ahead in Superunknown.</p></div>`;
    } else {
      const bits = [];
      if (p.news.length) bits.push(`${p.news.length} new`);
      if (p.reviews.length) bits.push(`${p.reviews.length} review`);
      startLabel = `<button class="btn primary" id="start">Start<small>About ${minutes(p)} min · ${bits.join(' · ')}</small></button>`;
    }
    const kBits = [];
    if (kp.reviews.length) kBits.push(`${kp.reviews.length} to review`);
    if (kp.news.length) kBits.push(`${kp.news.length} new`);
    $app.innerHTML = `
      ${brand()}
      ${p.paused ? `<div class="notice"><b>Catch-up day.</b> Reviews only today. New words come back once you’re caught up.</div>` : ''}
      ${startLabel}
      ${p.reviews.length && !nothing ? `<button class="btn ghost" id="easy">Low-energy day? Just review (about 5 min)</button>` : ''}
      <div class="card" style="margin-top:14px">
        <div class="row between">
          <div><div class="faint">Words known</div><div class="big-num">${known}</div></div>
          <div style="text-align:right"><div class="faint">Learning</div><div style="font-size:24px;font-weight:800">${learning}</div></div>
        </div>
        ${weekDots()}
      </div>
      <button class="card btn" id="to-kanji" style="text-align:left">
        <div class="row between"><div><b>OK Kanji</b><div class="faint">${kBits.length ? kBits.join(' · ') : 'All caught up'}</div></div><span class="jp" style="font-size:30px">字</span></div>
      </button>
      <p class="faint" style="text-align:center">${tier.name ? `${esc(tier.name)} · ` : ''}${S.settings.quota} new words a day · change in Settings</p>`;
    const st = $app.querySelector('#start');
    if (st) st.onclick = () => startSession('w', false);
    const ez = $app.querySelector('#easy');
    if (ez) ez.onclick = () => startSession('w', true);
    $app.querySelector('#to-kanji').onclick = () => { tab = 'kanji'; render(); };
  }

  function renderKanji() {
    const p = plan('k', false);
    const nothing = !p.reviews.length && !p.news.length;
    const bits = [];
    if (p.news.length) bits.push(`${p.news.length} new`);
    if (p.reviews.length) bits.push(`${p.reviews.length} review`);
    const groups = [
      { title: 'Japanese 3', list: KANJI.filter(k => k.y === 3) },
      { title: 'Japanese 2', list: KANJI.filter(k => k.y === 2) },
      { title: 'Japanese 1', list: KANJI.filter(k => k.y === 1) },
    ];
    const tile = k => {
      const s = stageOf(k);
      return `<button class="ktile ${s >= KNOWN_STAGE ? 'known' : s > 0 ? 'learning' : ''}" data-id="${esc(k.id)}" aria-label="${esc(k.k)} ${esc(k.m)}">${esc(k.k)}</button>`;
    };
    $app.innerHTML = `
      <h1>OK Kanji</h1>
      <p class="muted">${S.settings.kanjiWrite ? 'Writing practice is on: you’ll write some kanji on paper, then check.' : 'Meanings and readings. Turn on writing practice in Settings.'}</p>
      ${nothing ? `<div class="card" style="text-align:center"><b>All caught up on kanji.</b></div>`
        : `<button class="btn primary" id="kstart">Start kanji<small>About ${minutes(p)} min · ${bits.join(' · ')}</small></button>`}
      <div class="legend"><span><i></i>Not yet</span><span><i style="background:var(--surface-2)"></i>Learning</span><span><i style="background:var(--ice)"></i>Known</span></div>
      ${groups.map(g => `<div class="card"><h3>${g.title}</h3><div class="kgrid">${g.list.map(tile).join('')}</div></div>`).join('')}`;
    const ks = $app.querySelector('#kstart');
    if (ks) ks.onclick = () => startSession('k', false);
    $app.querySelectorAll('.ktile').forEach(b => b.onclick = () => showKanjiSheet(BY_ID.get(b.dataset.id)));
  }

  function showKanjiSheet(k) {
    setNav(false);
    $app.innerHTML = `
      <div class="topbar"><button class="x" id="back" aria-label="Back">←</button><div style="flex:1"></div></div>
      <div class="learn">${kanjiDetail(k)}</div>
      <button class="btn" id="back2" style="margin-top:18px">Back</button>`;
    wireExamples();
    $app.querySelector('#back').onclick = $app.querySelector('#back2').onclick = () => render();
    window.scrollTo(0, 0);
  }

  function renderUnknown() {
    const tough = Object.keys(S.items)
      .map(id => BY_ID.get(id)).filter(x => x && x.kind === 'w')
      .filter(w => S.items[w.id].miss >= 2 && S.items[w.id].s < KNOWN_STAGE)
      .sort((a, b) => S.items[b.id].miss - S.items[a.id].miss).slice(0, 15);
    const next = newQueue('w').slice(0, 8);
    const unitRow = (y, u) => {
      const ws = wordsInUnit(y, u);
      const k = ws.filter(w => stageOf(w) >= KNOWN_STAGE).length;
      return `<button class="unit-btn" data-y="${y}" data-u="${esc(u)}"><span class="u">${esc(u)}</span><span class="mini"><div style="width:${Math.round(100 * k / Math.max(1, ws.length))}%"></div></span><span class="c">${k}/${ws.length}</span></button>`;
    };
    const unitsOf = y => [...new Set(WORDS.filter(w => w.y === y).map(w => w.u))].sort(cmpUnit);
    const placeLeft = y => unitsOf(y).filter(u => !S.placement[`${y}|${u}`]).length;
    $app.innerHTML = `
      <h1>Superunknown</h1>
      <p class="muted">Words you haven’t locked in yet. New ones come in a few at a time. You don’t have to do anything here, but it’s here when you want it.</p>
      ${tough.length ? `
        <div class="card">
          <h2>Tough ones</h2>
          <p class="faint">Words you’ve missed a few times. A quick drill helps.</p>
          <ul class="list">${tough.map(w => `<li><span class="w">${esc(w.jp)}</span><span class="e">${esc(w.en)}</span></li>`).join('')}</ul>
          <button class="btn" id="drill" style="margin-top:10px">Drill these</button>
        </div>` : ''}
      <div class="card">
        <h2>Test coming up?</h2>
        <p class="faint">Study every word in one unit. New ones get introduced first.</p>
        ${unitsOf(3).map(u => unitRow(3, u)).join('')}
        <details><summary>Japanese 2 units</summary>${unitsOf(2).map(u => unitRow(2, u)).join('')}</details>
        <details><summary>Japanese 1 units</summary>${unitsOf(1).map(u => unitRow(1, u)).join('')}</details>
      </div>
      ${next.length ? `
        <div class="card">
          <h2>Coming up next</h2>
          <ul class="list">${next.map(w => `<li><span class="w">${esc(w.jp)}</span><span class="e">${esc(w.en)}</span></li>`).join('')}</ul>
        </div>` : ''}
      <div class="card">
        <h2>Skip what you already know</h2>
        <p class="faint">A quick check of older units. Words you get right skip ahead. Stop any time; it picks up where you left off.</p>
        <button class="btn" id="pl1">${placeLeft(1) ? `Check Japanese 1 (${placeLeft(1)} units left)` : 'Japanese 1 checked ✓'}</button>
        <button class="btn" id="pl2">${placeLeft(2) ? `Check Japanese 2 (${placeLeft(2)} units left)` : 'Japanese 2 checked ✓'}</button>
      </div>`;
    const d = $app.querySelector('#drill');
    if (d) d.onclick = () => startCustom(tough, 'Tough ones');
    $app.querySelectorAll('.unit-btn').forEach(b => b.onclick = () => {
      const y = +b.dataset.y, u = b.dataset.u;
      startCustom(wordsInUnit(y, u), `Japanese ${y} · unit ${u}`);
    });
    $app.querySelector('#pl1').onclick = () => placeLeft(1) && startPlacement(1);
    $app.querySelector('#pl2').onclick = () => placeLeft(2) && startPlacement(2);
  }

  function renderSettings() {
    const q = S.settings.quota;
    const tier = tierFor(q);
    $app.innerHTML = `
      <h1>Settings</h1>
      <div class="card">
        <div class="setting">
          <div class="slider-head"><label for="quota">New words per day</label><span class="slider-val" id="qv">${q}</span></div>
          <input type="range" id="quota" min="${MIN_QUOTA}" max="${MAX_QUOTA}" step="1" value="${q}">
          <div class="row between"><span class="tier ${tier.name === 'Beast Mode' ? 'beast' : ''}" id="qt">${esc(tier.label)}</span><span class="muted" id="qm">about ${tierMinutes(q)} min a day</span></div>
        </div>
        <div class="setting">
          <label>New kanji per day</label>
          <div class="seg" id="kpd">${[1, 2, 3].map(n => `<button data-n="${n}" class="${S.settings.kanjiPerDay === n ? 'on' : ''}">${n}</button>`).join('')}</div>
        </div>
        <div class="setting">
          <label for="unit">Current Japanese 3 unit</label>
          <select id="unit">${J3_UNITS.map(u => `<option ${u === currentUnit() ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
          <p class="faint" style="margin-top:6px">Words from this unit come first.</p>
        </div>
      </div>
      <div class="card">
        <div class="setting switch"><label for="autoplay">Play Japanese audio automatically</label><input type="checkbox" id="autoplay" ${S.settings.autoplay ? 'checked' : ''}></div>
        <div class="setting switch"><label for="readings">Show readings under kanji</label><input type="checkbox" id="readings" ${S.settings.readings ? 'checked' : ''}></div>
        <div class="setting switch"><label for="kwrite">Kanji writing practice (write on paper, then check)</label><input type="checkbox" id="kwrite" ${S.settings.kanjiWrite ? 'checked' : ''}></div>
        <div class="setting">
          <div class="row between"><label>Japanese voice</label><button class="speak" id="tv" aria-label="Test voice" style="margin:0">🔊</button></div>
          <p class="faint" id="voice-msg" style="margin-top:6px">${jaVoice ? `Using: ${esc(jaVoice.name)}` : voiceHelp()}</p>
        </div>
      </div>
      <div class="card">
        <h2>Backup</h2>
        <p class="faint">Progress is saved on this phone only. Save a backup before switching phones or clearing Chrome’s data.</p>
        <button class="btn" id="bk">Save backup file</button>
        <button class="btn" id="rs">Restore from backup</button>
        <input type="file" id="rsfile" accept=".json,application/json" hidden>
      </div>
      <div class="card">
        <button class="btn danger" id="reset">Reset all progress</button>
        <p class="faint" style="margin-top:10px">Kid あ · vocab updated ${esc(DATA.built)}</p>
      </div>`;

    const $q = $app.querySelector('#quota');
    let wasMax = q === MAX_QUOTA;
    $q.oninput = () => {
      const v = +$q.value;
      const t = tierFor(v);
      $app.querySelector('#qv').textContent = v;
      const $t = $app.querySelector('#qt');
      $t.textContent = t.label;
      $t.classList.toggle('beast', t.name === 'Beast Mode');
      $app.querySelector('#qm').textContent = `about ${tierMinutes(v)} min a day`;
      if (v === MAX_QUOTA && !wasMax) beastQuake();
      wasMax = v === MAX_QUOTA;
    };
    $q.onchange = () => { S.settings.quota = Math.max(MIN_QUOTA, Math.min(MAX_QUOTA, +$q.value)); save(); };
    $app.querySelectorAll('#kpd button').forEach(b => b.onclick = () => { S.settings.kanjiPerDay = +b.dataset.n; save(); renderSettings(); });
    $app.querySelector('#unit').onchange = e => { S.settings.unit = e.target.value; save(); };
    $app.querySelector('#autoplay').onchange = e => { S.settings.autoplay = e.target.checked; save(); };
    $app.querySelector('#readings').onchange = e => { S.settings.readings = e.target.checked; save(); };
    $app.querySelector('#kwrite').onchange = e => { S.settings.kanjiWrite = e.target.checked; save(); };
    $app.querySelector('#tv').onclick = testVoice;
    $app.querySelector('#bk').onclick = saveBackup;
    const $f = $app.querySelector('#rsfile');
    $app.querySelector('#rs').onclick = () => $f.click();
    $f.onchange = () => restoreBackup($f.files[0]);
    $app.querySelector('#reset').onclick = () => {
      if (confirm('Reset ALL progress? This can’t be undone.') && confirm('Really? Every word goes back to new.')) {
        S = defaults(); save(); tab = 'home'; render();
      }
    };
  }

  function saveBackup() {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const name = `kid-a-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Kid あ backup' }).catch(() => {});
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function restoreBackup(file) {
    if (!file) return;
    file.text().then(txt => {
      const s = JSON.parse(txt);
      if (!s || s.v !== 1 || typeof s.items !== 'object') throw new Error('bad');
      if (!confirm('Replace the progress on this phone with the backup?')) return;
      const d = defaults();
      S = Object.assign(d, s, { settings: Object.assign(d.settings, s.settings) });
      save(); render(); alert('Backup restored.');
    }).catch(() => alert('That file isn’t a Kid あ backup.'));
  }

  function beastQuake() {
    const pts = [];
    for (let x = 0; x <= 480; x += 6) {
      const amp = x < 90 ? 3 : x < 330 ? 48 * Math.sin((x - 90) / 240 * Math.PI) : 4;
      pts.push(`${x},${60 + (Math.random() * 2 - 1) * amp}`);
    }
    const $qk = document.getElementById('quake');
    $qk.innerHTML = `
      <div class="title">BEAST QUAKE</div>
      <svg viewBox="0 0 480 120" aria-hidden="true"><polyline points="${pts.join(' ')}"/></svg>
      <div class="sub">20 words a day. Max setting.</div>
      <div class="faint" style="margin-top:18px">tap to close</div>`;
    $qk.hidden = false;
    document.body.classList.add('shaking');
    if (navigator.vibrate) navigator.vibrate([60, 40, 90, 40, 140, 40, 220]);
    const close = () => { $qk.hidden = true; document.body.classList.remove('shaking'); };
    $qk.onclick = close;
    setTimeout(() => document.body.classList.remove('shaking'), 900);
    setTimeout(close, 3200);
  }

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------
  // A session is a queue of steps: { item, mode: 'learn' | 'quiz', isNew, graded }.
  function startSession(kind, easy) {
    const p = plan(kind, easy);
    const reviews = shuffle(p.reviews.slice()).map(item => ({ item, mode: 'quiz' }));
    const queue = reviews.slice();
    // Spread new items through the session, after a short warm-up of reviews.
    p.news.forEach((item, i) => {
      const at = Math.min(queue.length, 2 + Math.round((i + 1) * reviews.length / (p.news.length + 1)) + i * 2);
      queue.splice(at, 0, { item, mode: 'learn', isNew: true });
    });
    beginSession({ kind, queue, title: kind === 'k' ? 'OK Kanji' : '', countsNew: true });
  }
  function startCustom(words, title) {
    const learn = words.filter(w => !S.items[w.id]).map(item => ({ item, mode: 'learn', isNew: true }));
    const quiz = shuffle(words.filter(w => S.items[w.id])).map(item => ({ item, mode: 'quiz' }));
    beginSession({ kind: 'w', queue: learn.concat(quiz), title, countsNew: false });
  }
  function beginSession(opts) {
    if (!opts.queue.length) { render(); return; }
    session = Object.assign({ pos: 0, total: opts.queue.length, done: 0, newLearned: 0, reviewed: 0, misses: 0 }, opts);
    history.pushState({ kida: 'session' }, '');
    renderSession();
  }
  // Android back button (or exitSession) leaves a session or quick check and returns to the tabs.
  window.addEventListener('popstate', () => {
    session = null;
    placing = null;
    save();
    render();
  });
  function exitSession() {
    session = null;
    save();
    if (history.state && history.state.kida === 'session') history.back(); else render();
  }

  function renderSession() {
    setNav(false);
    const s = session;
    if (s.pos >= s.queue.length) return renderDone();
    const step = s.queue[s.pos];
    const left = s.queue.length - s.pos;
    const pct = Math.round(100 * s.done / Math.max(1, s.done + left));
    const top = `
      <div class="topbar">
        <button class="x" id="quit" aria-label="Stop">✕</button>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="left">${left} left</div>
      </div>`;
    if (step.mode === 'learn') renderLearn(top, step);
    else renderQuiz(top, step);
    $app.querySelector('#quit').onclick = () => {
      if (s.done === 0 || confirm('Stop here? Everything you’ve done so far is saved.')) exitSession();
    };
    window.scrollTo(0, 0);
  }

  // requeueStep comes back a few cards later: soon after a new word (learn two, quiz two),
  // a bit later after a miss.
  function advance(requeueStep, soon) {
    const s = session;
    if (requeueStep) {
      const at = Math.min(s.queue.length, s.pos + 1 + (soon ? 1 : rand(3, 5)));
      s.queue.splice(at, 0, requeueStep);
    }
    s.pos++;
    s.done++;
    save();
    renderSession();
  }

  function wordDetail(w) {
    return `
      <div class="jp-big jp">${esc(w.jp)}</div>
      ${w.r && w.r !== w.jp ? `<div class="reading">${esc(w.r)}</div>` : ''}
      <button class="speak" data-say="${esc(w.r || w.jp)}" aria-label="Play audio">🔊</button>
      <div class="meaning">${esc(w.en)}</div>
      ${w.n ? `<div class="note jp">${esc(w.n)}</div>` : ''}`;
  }
  function kanjiDetail(k) {
    const on = clean(k.on), kun = clean(k.kun);
    return `
      <div class="kanji-huge">${esc(k.k)}</div>
      <div class="meaning">${esc(k.m)}</div>
      ${on || kun ? `<dl class="kv">${on ? `<dt>on (Chinese-style)</dt><dd>${esc(on)}</dd>` : ''}${kun ? `<dt>kun (Japanese-style)</dt><dd>${esc(kun)}</dd>` : ''}</dl>` : ''}
      <div class="examples">${k.ex.map(e => `<button class="ex" data-say="${esc(e.r)}"><span class="w">${esc(e.w)}</span><span class="r">${esc(e.r)}</span><span class="e">${esc(e.en)}</span></button>`).join('')}</div>
      ${k.s ? `<button class="ex sentence" data-say="${esc(k.s)}" style="justify-content:center">${esc(k.s)} 🔊</button>` : ''}`;
  }
  function wireExamples() {
    $app.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
  }

  function renderLearn(top, step) {
    const it = step.item;
    $app.innerHTML = `
      ${top}
      <div class="card learn">
        <div class="new-tag">NEW ${it.kind === 'k' ? 'KANJI' : 'WORD'}</div>
        ${it.kind === 'k' ? kanjiDetail(it) : wordDetail(it)}
      </div>
      <button class="btn primary" id="got">Got it</button>`;
    wireExamples();
    if (S.settings.autoplay) it.kind === 'k' ? (it.ex[0] && speak(it.ex[0].r)) : sayWord(it);
    $app.querySelector('#got').onclick = () => {
      if (!S.items[it.id]) {
        introduce(it, session.countsNew);
        session.newLearned++;
      }
      advance({ item: it, mode: 'quiz', isNew: true, graded: true }, true);
    };
  }

  function quizType(item) {
    if (item.kind === 'k') {
      const withReading = item.ex.filter(e => e.r);
      if (S.settings.kanjiWrite && stageOf(item) >= 2 && Math.random() < 0.5) return 'k-write';
      if (withReading.length && stageOf(item) >= 2 && Math.random() < 0.5) return 'k-reading';
      return 'k-meaning';
    }
    if (stageOf(item) <= 1) return 'jp2en';
    const types = ['jp2en', 'en2jp'];
    if (canSpeak && jaVoice) types.push('listen');
    return types[Math.floor(Math.random() * types.length)];
  }

  function renderQuiz(top, step) {
    const it = step.item;
    const type = step.type || (step.type = quizType(it));
    if (type === 'k-write') return renderWrite(top, step);

    let prompt, options, correct, optHtml, afterSay;
    if (type === 'k-meaning') {
      options = shuffle([it].concat(pickDistractors(it, KANJI, k => k.m)));
      prompt = `<div class="tag pill">What does this kanji mean?</div><div class="kanji-huge">${esc(it.k)}</div>`;
      optHtml = o => esc(o.m);
      afterSay = it.ex[0] && it.ex[0].r;
    } else if (type === 'k-reading') {
      const ex = step.ex || (step.ex = it.ex.filter(e => e.r)[rand(0, it.ex.filter(e => e.r).length - 1)]);
      const pool = [];
      KANJI.forEach(k => k.ex.forEach(e => { if (e.r && e !== ex) pool.push({ y: k.y, r: e.r }); }));
      const target = { y: it.y, r: ex.r };
      options = shuffle([target].concat(pickDistractors(target, pool, o => o.r)));
      it._target = target;
      prompt = `<div class="tag pill">How do you read it?</div><div class="jp-big jp">${esc(ex.w)}</div><div class="hint">${esc(ex.en)}</div>`;
      optHtml = o => `<span class="jp">${esc(o.r)}</span>`;
      afterSay = ex.r;
    } else if (type === 'en2jp') {
      options = shuffle([it].concat(pickDistractors(it, WORDS, w => w.jp)));
      prompt = `<div class="tag pill">Which one is it?</div><div class="en-big">${esc(it.en)}</div>`;
      optHtml = o => `<span class="jp">${esc(o.jp)}</span>${showReading(o) ? `<small>${esc(o.r)}</small>` : ''}`;
      afterSay = it.r || it.jp;
    } else if (type === 'listen') {
      options = shuffle([it].concat(pickDistractors(it, WORDS, w => w.en)));
      prompt = `<div class="tag pill">Listen. What does it mean?</div><button class="speak huge" data-say="${esc(it.r || it.jp)}" aria-label="Play again">🔊</button>`;
      optHtml = o => esc(o.en);
      afterSay = it.r || it.jp;
    } else { // jp2en
      options = shuffle([it].concat(pickDistractors(it, WORDS, w => w.en)));
      prompt = `<div class="tag pill">What does it mean?</div><div class="jp-big jp">${esc(it.jp)}</div>${showReading(it) ? `<div class="reading">${esc(it.r)}</div>` : ''}
        <div><button class="speak" data-say="${esc(it.r || it.jp)}" aria-label="Play audio">🔊</button></div>`;
      optHtml = o => esc(o.en);
      afterSay = it.r || it.jp;
    }
    correct = type === 'k-reading' ? it._target : it;

    $app.innerHTML = `
      ${top}
      <div class="prompt">${prompt}</div>
      <div class="options locked" id="opts">${options.map((o, i) => `<button class="opt" data-i="${i}">${optHtml(o)}</button>`).join('')}</div>
      <div class="feedback" id="fb"></div>`;
    wireExamples();
    if (S.settings.autoplay && (type === 'jp2en' || type === 'listen')) sayWord(it);
    if (type === 'listen' && !S.settings.autoplay) sayWord(it);

    const $opts = $app.querySelector('#opts');
    setTimeout(() => $opts.classList.remove('locked'), ANSWER_LOCK_MS);
    $opts.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if ($opts.classList.contains('done')) return;
      $opts.classList.add('done');
      const pick = options[+b.dataset.i];
      const ok = pick === correct;
      const rightBtn = $opts.querySelector(`.opt[data-i="${options.indexOf(correct)}"]`);
      rightBtn.classList.add('right');
      if (afterSay && (type === 'en2jp' || !ok)) speak(afterSay);
      finishQuiz(step, ok, () => {
        if (ok) return;
        b.classList.add('wrong');
        const fb = $app.querySelector('#fb');
        fb.innerHTML = `
          <div class="card">${it.kind === 'k'
            ? `<div class="jp" style="font-size:40px;font-weight:700">${esc(it.k)}</div><div><b>${esc(it.m)}</b></div>${type === 'k-reading' ? `<div class="jp muted">${esc(step.ex.w)} = ${esc(step.ex.r)}</div>` : ''}`
            : `<div class="jp" style="font-size:28px;font-weight:700">${esc(it.jp)}</div>${it.r && it.r !== it.jp ? `<div class="jp muted">${esc(it.r)}</div>` : ''}<div><b>${esc(it.en)}</b></div>`}
          </div>
          <button class="btn primary" id="next">Next</button>`;
        fb.querySelector('#next').onclick = () => advance({ item: it, mode: 'quiz', graded: true });
        fb.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    });
  }

  // Records the first answer for an item in this session, then moves on.
  function finishQuiz(step, ok, onWrong) {
    const s = session;
    if (!step.graded) {
      step.graded = true;
      if (!S.items[step.item.id]) introduce(step.item, false); // e.g. placement or unit study
      grade(step.item, ok);
      dayRec().rv++;
      s.reviewed++;
    } else if (!ok && S.items[step.item.id]) {
      S.items[step.item.id].miss = (S.items[step.item.id].miss || 0) + 1;
    }
    if (!ok) s.misses++;
    if (navigator.vibrate) navigator.vibrate(ok ? 12 : [30, 40, 30]);
    if (ok) setTimeout(() => advance(null), 650);
    else onWrong();
  }

  function renderWrite(top, step) {
    const it = step.item;
    const ex = it.ex.find(e => e.r) || it.ex[0];
    $app.innerHTML = `
      ${top}
      <div class="prompt">
        <div class="tag pill">Write it on paper</div>
        <div class="en-big">${esc(it.m)}</div>
        ${ex ? `<div class="reading">${esc(ex.r)} · ${esc(ex.en)}</div>` : ''}
        <p class="hint">Write the kanji, then check.</p>
      </div>
      <div id="reveal"><button class="btn primary" id="show">Check</button></div>`;
    $app.querySelector('#show').onclick = () => {
      $app.querySelector('#reveal').innerHTML = `
        <div class="card learn"><div class="kanji-huge">${esc(it.k)}</div>${ex ? `<div class="jp" style="font-size:22px">${esc(ex.w)}</div>` : ''}</div>
        <div class="row"><button class="btn" id="miss" style="flex:1">Not yet</button><button class="btn primary" id="hit" style="flex:1;font-size:18px">Got it</button></div>`;
      if (ex && S.settings.autoplay) speak(ex.r);
      $app.querySelector('#hit').onclick = () => finishQuiz(step, true, () => {});
      $app.querySelector('#miss').onclick = () => finishQuiz(step, false, () => advance({ item: it, mode: 'quiz', graded: true, type: 'k-meaning' }));
    };
  }

  function renderDone() {
    const s = session;
    const kind = s.kind;
    const more = s.countsNew && dueList(kind).length;
    const line = DONE_LINES[Math.floor(Math.random() * DONE_LINES.length)];
    $app.innerHTML = `
      <div class="done-screen">
        <img src="icons/icon-192.png" alt="" width="96" height="96" style="border-radius:50%">
        <div class="headline">${esc(line)}</div>
        <p class="muted">${s.title ? esc(s.title) + ' · ' : ''}${s.done} cards done.</p>
        <div class="stat-row">
          <div class="card"><div class="n">+${s.newLearned}</div><div class="faint">new</div></div>
          ${knownCount(kind)
            ? `<div class="card"><div class="n">${knownCount(kind)}</div><div class="faint">${kind === 'k' ? 'kanji' : 'words'} known</div></div>`
            : `<div class="card"><div class="n">${learningCount(kind)}</div><div class="faint">in progress</div></div>`}
        </div>
        <button class="btn primary" id="home">Done</button>
        ${more ? `<button class="btn ghost" id="more">Bonus round (${Math.min(more, REVIEW_CAP)} more reviews)</button>` : ''}
      </div>`;
    $app.querySelector('#home').onclick = exitSession;
    const m = $app.querySelector('#more');
    if (m) m.onclick = () => {
      const p = plan(kind, false);
      session = null;
      beginSessionReplace({ kind, queue: shuffle(p.reviews.slice()).map(item => ({ item, mode: 'quiz' })), title: 'Bonus round', countsNew: true });
    };
  }
  function beginSessionReplace(opts) {
    if (!opts.queue.length) { exitSession(); return; }
    session = Object.assign({ pos: 0, total: opts.queue.length, done: 0, newLearned: 0, reviewed: 0, misses: 0 }, opts);
    renderSession();
  }

  // ---------------------------------------------------------------------------
  // Quick check (placement) for Japanese 1 and 2
  // ---------------------------------------------------------------------------
  let placing = null;
  function startPlacement(year) {
    const units = [...new Set(WORDS.filter(w => w.y === year).map(w => w.u))].sort(cmpUnit)
      .filter(u => !S.placement[`${year}|${u}`]);
    if (!units.length) { render(); return; }
    placing = { year, units, ui: 0, q: [], qi: 0, right: [], markedKnown: 0 };
    history.pushState({ kida: 'session' }, '');
    nextPlacementUnit();
  }
  function nextPlacementUnit() {
    const p = placing;
    while (p.ui < p.units.length) {
      const u = p.units[p.ui];
      const pool = WORDS.filter(w => w.y === p.year && w.u === u && !S.items[w.id]);
      if (pool.length) {
        p.q = shuffle(pool.slice()).slice(0, 4);
        p.qi = 0; p.right = [];
        return renderPlacement();
      }
      S.placement[`${p.year}|${u}`] = true;
      p.ui++;
    }
    save();
    renderPlacementDone();
  }
  function renderPlacement() {
    setNav(false);
    const p = placing;
    const w = p.q[p.qi];
    const pct = Math.round(100 * p.ui / p.units.length);
    const options = shuffle([w].concat(pickDistractors(w, WORDS, x => x.en)));
    $app.innerHTML = `
      <div class="topbar">
        <button class="x" id="quit" aria-label="Stop">✕</button>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="left">J${p.year} · ${esc(p.units[p.ui])}</div>
      </div>
      <div class="prompt">
        <div class="tag pill">Quick check · skip it if you don’t know</div>
        <div class="jp-big jp">${esc(w.jp)}</div>${showReading(w) ? `<div class="reading">${esc(w.r)}</div>` : ''}
      </div>
      <div class="options locked" id="opts">
        ${options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.en)}</button>`).join('')}
        <button class="opt" data-i="-1" style="text-align:center;color:var(--muted)">Don’t know</button>
      </div>`;
    const $opts = $app.querySelector('#opts');
    setTimeout(() => $opts.classList.remove('locked'), ANSWER_LOCK_MS);
    $opts.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      if ($opts.classList.contains('done')) return;
      $opts.classList.add('done');
      const i = +b.dataset.i;
      const ok = i >= 0 && options[i] === w;
      if (ok) { b.classList.add('right'); p.right.push(w); }
      else if (i >= 0) b.classList.add('wrong');
      setTimeout(() => {
        p.qi++;
        if (p.qi < p.q.length) return renderPlacement();
        scorePlacementUnit();
        p.ui++;
        // Three units in a row with nothing known: the rest is new territory, stop checking.
        if (p.zeroRun >= 3) { p.stoppedEarly = true; save(); return renderPlacementDone(); }
        nextPlacementUnit();
      }, ok ? 350 : 550);
    });
    $app.querySelector('#quit').onclick = () => { save(); renderPlacementDone(); };
  }
  function scorePlacementUnit() {
    const p = placing;
    const u = p.units[p.ui];
    const t = today();
    p.zeroRun = p.right.length ? 0 : (p.zeroRun || 0) + 1;
    if (p.right.length === p.q.length) {
      // Aced the sample: treat the whole unit as known, spread first reviews over two weeks.
      for (const w of WORDS.filter(x => x.y === p.year && x.u === u && !S.items[x.id])) {
        S.items[w.id] = { s: 3, due: t + rand(3, 14), miss: 0, seen: 1 };
        p.markedKnown++;
      }
    } else {
      for (const w of p.right) {
        S.items[w.id] = { s: 2, due: t + rand(2, 5), miss: 0, seen: 1 };
        p.markedKnown++;
      }
    }
    S.placement[`${p.year}|${u}`] = true;
    save();
  }
  function renderPlacementDone() {
    const p = placing;
    const finished = p.ui >= p.units.length;
    $app.innerHTML = `
      <div class="done-screen">
        <div class="headline">${finished ? `Japanese ${p.year} checked.` : p.stoppedEarly ? 'Good place to stop.' : 'Saved. Pick it up any time.'}</div>
        <p class="muted">${p.markedKnown ? `${p.markedKnown} words skip ahead. You won’t study those from scratch.` : ''}
          ${p.stoppedEarly ? 'The next units look new, and that’s fine. Those words will come in a few at a time.' : (!p.markedKnown ? 'No problem. These words will come in a few at a time.' : '')}</p>
        ${finished && p.year === 1 ? `<button class="btn" id="j2">Check Japanese 2 next</button>` : ''}
        <button class="btn primary" id="home" style="margin-top:10px">Done</button>
      </div>`;
    const j2 = $app.querySelector('#j2');
    if (j2) j2.onclick = () => { placing = null; startPlacementReplace(2); };
    $app.querySelector('#home').onclick = () => {
      placing = null;
      tab = 'home';
      if (history.state && history.state.kida === 'session') history.back(); else render();
    };
  }
  function startPlacementReplace(year) {
    const units = [...new Set(WORDS.filter(w => w.y === year).map(w => w.u))].sort(cmpUnit)
      .filter(u => !S.placement[`${year}|${u}`]);
    if (!units.length) { render(); return; }
    placing = { year, units, ui: 0, q: [], qi: 0, right: [], markedKnown: 0 };
    nextPlacementUnit();
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  // Re-render when the app comes back after midnight so "today" is fresh.
  let lastDay = today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && today() !== lastDay && !session && !placing) {
      lastDay = today();
      render();
    }
  });
})();
