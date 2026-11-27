/* ===== 미나: 호감도 · 칩 · 선물 상점 · 옷장 · 리액션 ===== */
const MINA_BASE = 'mina/';
const Love = (() => {
  // ---------- 도우미 ----------
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const spick = (a, seed) => a[hash(seed) % a.length];
  const fmt = n => Number(n || 0).toLocaleString('ko-KR');
  const big = id => MINA_BASE + 'o' + id + '.webp';
  const thumb = id => MINA_BASE + 't' + id + '.webp';
  const today = () => Store.dayKey();

  // ---------- 호감도 단계 ----------
  // h: 필요한 누적 하트 · need: [난이도, 그 난이도 정답 수] 학습 조건
  const LV = [
    { h: 0, nm: '낯선 손님', unlock: '딜러 유니폼 6벌 · 1티어 선물' },
    { h: 100, nm: '단골 손님', unlock: '재킷·스퀘어넥 4벌 · 2티어 선물' },
    { h: 250, nm: '대화 상대', unlock: '컬러 드레스 7벌 · 선물 취향 공개' },
    { h: 500, nm: '친구', need: [1, 30], unlock: '새틴 드레스 6벌 · 3티어 선물 · 반말' },
    { h: 850, nm: '썸', need: [2, 20], unlock: '오프숄더·시퀸 드레스 8벌' },
    { h: 1500, nm: '연인', need: [3, 10], unlock: '시그니처 드레스 9벌 · 고백' }
  ];
  const NEED_NM = { 1: '입문', 2: '중급', 3: '고급' };

  // ---------- 의상 40벌 (번호 = 참고 이미지 번호, 마지막 값 = 열리는 단계) ----------
  const OUT = [
    ['39', '에메랄드 딜러', 0], ['10', '블랙골드 조끼', 0], ['15', '버건디 조끼', 0], ['23', '미드나잇 조끼', 0], ['29', '골드 브로케이드 조끼', 0], ['34', '레드 파이핑 조끼', 0],
    ['13', '아이보리 스퀘어넥', 1], ['18', '화이트 블레이저', 1], ['28', '레드 스퀘어넥', 1], ['32', '아이보리 트위드', 1],
    ['06', '버건디 벨벳', 2], ['08', '네이비 홀터', 2], ['14', '코발트 비대칭', 2], ['24', '틸 벨벳', 2], ['27', '플럼 새틴', 2], ['33', '버건디 스퀘어넥', 2], ['35', '에메랄드 스퀘어넥', 2],
    ['03', '레드 카울', 3], ['09', '샴페인 새틴', 3], ['20', '블랙 새틴 카울', 3], ['21', '에메랄드 홀터', 3], ['26', '화이트 홀터', 3], ['31', '사파이어 골드', 3],
    ['04', '에메랄드 원숄더', 4], ['07', '블랙 레이스', 4], ['11', '레드 오프숄더', 4], ['17', '로즈골드 시퀸', 4], ['22', '샴페인 오프숄더', 4], ['30', '블랙 원숄더', 4], ['37', '블랙 오프숄더', 4], ['38', '레드 원숄더', 4],
    ['01', '블랙골드 딜', 5], ['02', '블랙골드 칩', 5], ['05', '화이트골드 뷔스티에', 5], ['12', '에메랄드 브로케이드', 5], ['16', '블랙골드 스트랩', 5], ['19', '레드골드 자수', 5], ['25', '블랙골드 코르셋', 5], ['36', '샴페인 탑', 5], ['40', '블랙골드 시그니처', 5]
  ].map(([id, nm, lv]) => ({ id, nm, lv }));
  const outfit = id => OUT.find(o => o.id === id) || OUT[0];

  // ---------- 선물 ----------
  // tier: 1 = 처음부터, 2 = 1단계, 3 = 3단계 · pref: like ×1.5 · mid ×1 · hate ×0.2
  const TIER_LV = { 1: 0, 2: 1, 3: 3 };
  const PREF = { like: { m: 1.5, nm: '좋아함' }, mid: { m: 1, nm: '보통' }, hate: { m: 0.2, nm: '싫어함' } };
  const GIFTS = [
    ['coffee', '아이스 아메리카노', 1, 100, 5, 'mid', '딜링 중엔 커피가 보약이죠. 고마워요.', 'cup'],
    ['macaron', '마카롱 세트', 1, 200, 10, 'like', '어떻게 알았어요? 단 거 진짜 좋아하는데.', 'macaron'],
    ['keyring', '카드 모양 키링', 1, 250, 12, 'mid', '에이스 하트네요. …의미 있는 거예요?', 'card'],
    ['flower', '꽃다발', 2, 400, 20, 'like', '…고마워요. 오늘 하루 종일 기분 좋겠다.', 'flower'],
    ['book', '포커 전략책', 2, 500, 22, 'like', '이거 같이 읽어요! 밑줄 친 데 나중에 물어볼 거예요.', 'book'],
    ['perfume', '향수', 2, 700, 25, 'mid', '향이 제 스타일인지 어떻게 알았어요?', 'perfume'],
    ['bag', '명품 가방', 3, 1200, 30, 'hate', '이런 건… 좀 부담스러워. 마음만 받을게.', 'bag'],
    ['necklace', '실버 목걸이', 3, 1500, 50, 'like', '지금 차 봐도 돼? …어울려?', 'necklace'],
    ['dinner', '야경 레스토랑 예약권', 3, 2000, 60, 'like', '야경 보이는 데? 그럼 퇴근하고 바로 갈게.', 'moon']
  ].map(([id, nm, tier, price, h, pref, say, ic]) => ({ id, nm, tier, price, h, pref, say, ic }));
  const gift = id => GIFTS.find(g => g.id === id);
  const ICON = {
    cup: '<path d="M7 8h10l-1.3 12H8.3z"/><path d="M6 8h12M11 8l1-4"/>',
    macaron: '<ellipse cx="12" cy="8.5" rx="7" ry="3.2"/><path d="M5 11.5h14"/><ellipse cx="12" cy="15.5" rx="7" ry="3.2"/>',
    card: '<rect x="7" y="7" width="10" height="14" rx="1.6"/><circle cx="12" cy="4" r="2"/><path d="M12 11.5c-1-1.4-3-.6-2.4.9.4 1 2.4 2.4 2.4 2.4s2-1.4 2.4-2.4c.6-1.5-1.4-2.3-2.4-.9z"/>',
    flower: '<circle cx="12" cy="7" r="2.2"/><circle cx="8.3" cy="9.3" r="2.2"/><circle cx="15.7" cy="9.3" r="2.2"/><path d="M9 13l3 8 3-8z"/>',
    book: '<path d="M4 5h7v15H4zM11 5h9v15h-9"/><path d="M6.5 9h2.5M14 9h3.5"/>',
    perfume: '<rect x="7" y="9" width="10" height="11" rx="2"/><path d="M10 9V6h4v3M12 3v3"/>',
    bag: '<path d="M5 9h14l-1 11H6z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
    necklace: '<path d="M5 4c0 6 3.5 9 7 9s7-3 7-9"/><path d="M12 13l2 3-2 3-2-3z"/>',
    moon: '<path d="M18 15.5A7 7 0 0 1 9.5 6a7 7 0 1 0 8.5 9.5z"/><path d="M5 20h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    chip: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>'
  };
  const icon = (k, cls = '') => `<svg class="lv-ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  // ---------- 대사 ----------
  // early: 0~2단계(존댓말) · late: 3단계부터(반말)
  const SAY = {
    ok: {
      early: ['오, 제법인데요? 우연 아니죠?', '정답이에요. 저 지금 좀 놀랐어요.', '그 판단, 딜러석에서 봐도 깔끔했어요.', '좋아요. 그렇게 읽는 거예요.'],
      late: ['봐, 내가 가르친 대로잖아. 좀 멋있네.', '역시. 오늘 감 좋다?', '그 콜 타이밍, 나 반할 뻔했어.', '잘했어. 다음 것도 보여줘.']
    },
    no: {
      early: ['음… 그 선택은 칩이 울겠는데요.', '아깝다. 해설 같이 봐요.', '괜찮아요, 다들 거기서 한 번씩 틀려요.', '다음엔 팟오즈부터 세어 봐요.'],
      late: ['괜찮아, 나도 저기서 많이 틀렸어. 같이 보자.', '에이, 너답지 않게. 해설 봐 봐.', '틀려도 돼. 다음에 맞히면 되지.', '이건 내가 따로 설명해 줄게.']
    },
    streak: {
      early: ['오늘 컨디션 좋으시네요?', '연속 정답이라니… 단골 될 자격 있어요.', '이러다 제가 배워야겠어요.'],
      late: ['오늘 너 좀 반칙인데…', '계속 이러면 나 집중 안 돼.', '연속 정답? 오늘 무슨 날이야?']
    },
    hello: {
      early: ['어서 오세요. 자리 맡아 뒀어요.', '오늘도 한 판 하실 거죠?', '오늘은 어떤 핸드가 올까요.'],
      late: ['왔어? 기다렸잖아.', '늦었다. 오늘은 몇 판 할 거야?', '오늘도 내 테이블에 앉을 거지?']
    }
  };
  const phase = () => (st().lv >= 3 ? 'late' : 'early');
  const line = (k, seed) => spick(SAY[k][phase()], seed);

  // ---------- 상태 ----------
  let lvMap = null;
  function correctByLv() {
    if (!lvMap) { lvMap = {}; PROBLEMS.forEach(q => { lvMap[q.id] = q.lv; }); }
    const out = { 1: 0, 2: 0, 3: 0 };
    Object.entries(Store.S.p.solved || {}).forEach(([id, v]) => {
      if (!v.ok) return;
      const l = lvMap[id] || (App.byId(id) || {}).lv;
      if (out[l] != null) out[l]++;
    });
    return out;
  }
  function calc(l) {
    const c = correctByLv(); let k = 0;
    for (let i = 1; i < LV.length; i++) {
      const L = LV[i];
      if (l.heart < L.h || (L.need && c[L.need[0]] < L.need[1])) break;
      k = i;
    }
    return k;
  }
  function st() {
    const p = Store.S.p;
    const d = { chips: 0, heart: 0, lv: 0, outfit: '39', gifts: {}, day: { d: '', m: {} }, init: false };
    // 객체를 새로 만들지 않고 빠진 값만 채운다(다른 곳에서 잡고 있는 참조가 끊기지 않게)
    if (!p.love || typeof p.love !== 'object') p.love = {};
    const l = p.love;
    Object.keys(d).forEach(k => { if (l[k] === undefined) l[k] = d[k]; });
    if (!l.init) {
      // 기존 기록 소급: 그동안 모은 포인트는 칩으로, 정답 1개당 하트 2
      l.init = true; l.chips = p.tot.p || 0; l.heart = (p.tot.c || 0) * 2; l.lv = calc(l);
      Store.save();
    }
    if (l.day.d !== today()) l.day = { d: today(), m: {} };
    return l;
  }
  function nextInfo() {
    const l = st(), n = LV[l.lv + 1];
    if (!n) return null;
    const c = correctByLv();
    return { nm: n.nm, h: n.h, heartLeft: Math.max(0, n.h - l.heart), need: n.need ? { nm: NEED_NM[n.need[0]], have: Math.min(c[n.need[0]], n.need[1]), n: n.need[1] } : null };
  }
  const progressPct = () => {
    const l = st(), cur = LV[l.lv], n = LV[l.lv + 1];
    if (!n) return 100;
    return Math.max(0, Math.min(100, Math.round((l.heart - cur.h) / (n.h - cur.h) * 100)));
  };
  const unlocked = o => o.lv <= st().lv;
  const tierOpen = t => st().lv >= TIER_LV[t];
  const tasteKnown = g => st().lv >= 2 || !!st().gifts[g.id];

  // ---------- 보상 ----------
  function gain(set, chips, heart) {
    const l = st(); l.chips += chips; l.heart += heart;
    if (set) { set.love = set.love || { chips: 0, heart: 0 }; set.love.chips += chips; set.love.heart += heart; }
  }
  /** 채점 세트에서 처음 맞힌 문제 */
  function onCorrect(set) { gain(set, POINTS, 2); Store.save(); checkLevel(); }
  /** 세트가 끝났을 때 보너스 */
  function onSetEnd(set) {
    if (!set || set.loveDone || set.mode === 'preview') return;
    set.loveDone = true;
    if (set.mode === 'scored' && set.fun) {
      if (set.fun.perfect) gain(set, 100, 5);
      if (set.fun.win) gain(set, 50, 0);
    } else if (set.mode === 'retry' && set.answers.filter(Boolean).length) gain(set, 0, 3);
    Store.save(); checkLevel();
  }
  function checkLevel() {
    const l = st(), k = calc(l);
    if (k > l.lv) { l.lv = k; Store.save(); setTimeout(() => levelUp(k), 450); }
  }

  // ---------- 선물 주기 ----------
  const dayFactor = id => [1, 0.5, 0][Math.min(st().day.m[id] || 0, 2)];
  const heartsFor = g => Math.round(g.h * PREF[g.pref].m * dayFactor(g.id));
  function give(id) {
    const l = st(), g = gift(id);
    if (!g || !tierOpen(g.tier)) return U.toast('아직 열리지 않은 선물이에요.');
    if (l.chips < g.price) return U.toast(`칩이 ${fmt(g.price - l.chips)}개 부족해요. 문제를 맞혀서 모아 보세요.`);
    const h = heartsFor(g), again = l.day.m[id] || 0;
    l.chips -= g.price; l.heart += h;
    l.gifts[id] = (l.gifts[id] || 0) + 1; l.day.m[id] = again + 1;
    Store.save();
    const say = again >= 2 ? '또 같은 거? 오늘은 이걸로 충분해요.' : again === 1 ? '오늘 두 번째네요. 고맙긴 한데…' : g.say;
    const face = g.pref === 'hate' ? 'pout' : '';
    const v = Layer.open(`<div class="lv-modal ${face}"><div class="lv-modal-img"><img src="${big(l.outfit)}" alt="미나"></div>
      <div class="lv-modal-body"><span class="lv-eyebrow">${U.esc(g.nm)}을(를) 선물했어요</span>
      <p class="lv-say">“${U.esc(say)}”</p>
      <div class="lv-gain"><span class="lv-tag heart">${icon('heart')}하트 +${h}</span><span class="lv-tag">${PREF[g.pref].nm === '싫어함' ? '취향이 아니었나 봐요' : '미나 취향: ' + PREF[g.pref].nm}</span></div>
      <button class="btn btn-ink btn-block" type="button" id="lv-ok">확인</button></div></div>`, '선물 반응');
    const close = () => { Layer.close(); App.render(); checkLevel(); };
    U.$('#lv-ok', v).onclick = close; v.onclick = e => { if (e.target === v) close(); };
    U.$('#lv-ok', v).focus();
  }
  function confirmGive(id) {
    const l = st(), g = gift(id), h = heartsFor(g), known = tasteKnown(g);
    const short = l.chips < g.price;
    const v = Layer.open(`<div class="modal lv-confirm"><div class="lv-gift-ic big">${icon(g.ic)}</div><h2>${U.esc(g.nm)}</h2>
      <div class="lv-conf-rows"><div><span>가격</span><b>${icon('chip')}칩 ${fmt(g.price)}</b></div><div><span>예상 하트</span><b>${known ? '+' + h : '?'}${dayFactor(id) < 1 ? ` <small>(오늘 ${st().day.m[id]}번 줌)</small>` : ''}</b></div><div><span>남는 칩</span><b>${short ? '부족' : fmt(l.chips - g.price)}</b></div></div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-line" type="button" id="lv-no">취소</button><button class="btn btn-ink" type="button" id="lv-yes" ${short ? 'disabled' : ''}>미나에게 주기</button></div></div>`, '선물하기');
    U.$('#lv-no', v).onclick = Layer.close; v.onclick = e => { if (e.target === v) Layer.close(); };
    U.$('#lv-yes', v).onclick = () => { Layer.close(); give(id); };
    U.$(short ? '#lv-no' : '#lv-yes', v).focus();
  }
  function levelUp(k) {
    const L = LV[k], l = st();
    const v = Layer.open(`<div class="lv-modal up"><div class="lv-modal-img"><img src="${big(l.outfit)}" alt="미나"><span class="lv-up-badge">호감도 ${k}단계</span></div>
      <div class="lv-modal-body"><span class="lv-eyebrow">LEVEL UP</span><h2>${U.esc(L.nm)}</h2>
      <p class="lv-say">“${k >= 3 ? '이제 우리 말 편하게 할까? …싫으면 말고.' : k === 1 ? '자주 오시네요. 이제 단골이에요.' : '요즘 이 시간이 기다려져요.'}”</p>
      <p class="lv-unlock">새로 열림 · ${U.esc(L.unlock)}</p>
      <button class="btn btn-ink btn-block" type="button" id="lv-ok">옷장 보러 가기</button></div></div>`, '호감도 단계 상승');
    U.$('#lv-ok', v).onclick = () => { Layer.close(); App.go('mina'); };
    v.onclick = e => { if (e.target === v) Layer.close(); };
  }

  // ---------- 다른 화면에 끼우는 조각 ----------
  const heroImg = () => big(st().outfit);
  const gauge = () => `<div class="lv-gauge" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPct()}" aria-label="다음 단계까지"><i style="width:${progressPct()}%"></i></div>`;
  function needLine(nx) {
    if (!nx) return '모든 단계를 열었어요.';
    const parts = [`하트 ${fmt(st().heart)} / ${fmt(nx.h)}`];
    if (nx.need) parts.push(`${nx.need.nm} 정답 ${nx.need.have} / ${nx.need.n}`);
    return parts.join(' · ');
  }
  /** 홈 히어로 아래 호감도 띠 */
  function homeStrip() {
    const l = st(), nx = nextInfo();
    return `<div class="lv-strip">
      <button class="lv-strip-face" type="button" data-go="mina" aria-label="미나 화면 열기"><img src="${thumb(l.outfit)}" alt=""></button>
      <div class="lv-strip-main"><div class="lv-strip-top"><b>미나 · ${U.esc(LV[l.lv].nm)}</b><span>${nx ? `다음 ‘${U.esc(nx.nm)}’` : '최고 단계'}</span></div>${gauge()}<small>${U.esc(needLine(nx))}</small></div>
      <div class="lv-strip-btns"><span class="lv-bal">${icon('chip')}${fmt(l.chips)}</span><button class="btn btn-line" type="button" data-go="shop">선물 상점</button></div></div>`;
  }
  const homeQuote = () => line('hello', today());
  /** 해설 위 미나 리액션 말풍선 */
  function bubble(ok, seed, set, rec) {
    const f = Fun.st();
    const k = ok ? (set.mode === 'scored' && f.streak + 1 >= 3 ? 'streak' : 'ok') : 'no';
    const reward = set.mode === 'scored' && rec && rec.first && ok ? `<span class="lv-tag">${icon('chip')}칩 +${POINTS}</span><span class="lv-tag heart">${icon('heart')}하트 +2</span>` : '';
    return `<div class="lv-bubble ${ok ? 'ok' : 'no'}"><img src="${thumb(st().outfit)}" alt="미나"><div><b>미나</b><p>${U.esc(line(k, seed + k))}</p>${reward ? `<div class="lv-gain">${reward}</div>` : ''}</div></div>`;
  }
  /** 결과 화면 블록 */
  function resultBlock(set) {
    if (!set || !set.love || (!set.love.chips && !set.love.heart)) return '';
    const g = set.love;
    return `<div class="lv-result"><img src="${thumb(st().outfit)}" alt="미나"><div><span class="lv-eyebrow">이번 라운드로 모은 것</span>
      <div class="lv-gain">${g.chips ? `<span class="lv-tag">${icon('chip')}칩 +${fmt(g.chips)}</span>` : ''}${g.heart ? `<span class="lv-tag heart">${icon('heart')}하트 +${g.heart}</span>` : ''}</div>
      <small>${U.esc(needLine(nextInfo()))}</small></div>
      <button class="btn btn-line" type="button" data-go="shop">선물하러 가기</button></div>`;
  }

  // ---------- 미나 화면 ----------
  const EPS = [
    ['신입 손님', 0, '처음 앉은 테이블, 미나가 포지션부터 알려줘요'], ['두 번째 커피', 1, '쉬는 시간, 자판기 앞에서 우연히'],
    ['단골의 자격', 2, '진상 손님에게서 미나를 도와줘요'], ['퇴근 후 카페', 3, '첫 데이트, 반말 제안'],
    ['비 오는 날', 3, '우산 하나를 같이 쓰고 역까지'], ['파이널 테이블의 기억', 4, '미나가 선수를 그만둔 그 핸드'],
    ['한강 야경', 4, '“다시 대회 나가볼까?”'], ['라이벌의 도발', 4, '미나를 두고 헤드업 대결'],
    ['대회 전날 밤', 5, '미나의 복귀전을 응원해요'], ['당신의 핸드', 5, '고백']
  ];
  const View = {
    html() {
      const l = st(), nx = nextInfo(), cur = outfit(l.outfit), opened = OUT.filter(unlocked).length;
      const wardrobe = OUT.map(o => {
        const on = unlocked(o), wear = o.id === l.outfit;
        return on
          ? `<button class="lv-wear${wear ? ' on' : ''}" type="button" data-wear="${o.id}" aria-pressed="${wear}" aria-label="${U.esc(o.nm)}${wear ? ', 착용 중' : ''}"><img src="${thumb(o.id)}" alt="" loading="lazy"><span>${wear ? '착용 중' : U.esc(o.nm)}</span></button>`
          : `<div class="lv-wear off" aria-label="${U.esc(o.nm)}, ${o.lv}단계에서 열림"><img src="${thumb(o.id)}" alt="" loading="lazy">${icon('lock', 'lk')}<span>${o.lv}단계</span></div>`;
      }).join('');
      const eps = EPS.map(([nm, lv, d], i) => `<li class="${lv <= l.lv ? 'open' : ''}"><span class="lv-ep-n">${i + 1}</span><div><b>${U.esc(nm)}</b><small>${U.esc(d)}</small></div><em>${lv <= l.lv ? '준비 중' : lv + '단계'}</em></li>`).join('');
      const steps = LV.map((L, i) => `<li class="${i <= l.lv ? 'done' : ''}${i === l.lv ? ' cur' : ''}"><i></i><span>${U.esc(L.nm)}</span></li>`).join('');
      return `<section class="lv-screen">
        <div class="lv-hero"><img src="${big(l.outfit)}" alt="${U.esc(cur.nm)}을 입은 미나">
          <div class="lv-hero-copy"><span class="lv-eyebrow">MINA · 홀덤 라운지 수석 딜러</span>
            <h1>${U.esc(LV[l.lv].nm)}</h1><p class="lv-say">“${U.esc(line('hello', today() + 'm'))}”</p>
            <ol class="lv-steps" aria-label="호감도 단계">${steps}</ol>
            ${gauge()}<small class="lv-need">${U.esc(needLine(nx))}${nx && nx.need && nx.need.have < nx.need.n ? ' · 하트와 학습 조건을 둘 다 채워야 올라가요' : ''}</small>
            <div class="lv-hero-btns"><button class="btn btn-ink" type="button" data-go="shop">${icon('heart')}선물하기</button><button class="btn btn-line" type="button" id="lv-play">미나 테이블에 앉기</button><span class="lv-bal">${icon('chip')}칩 ${fmt(l.chips)}</span></div>
          </div></div>
        <div class="lv-sec"><div class="lv-sec-h"><h2>옷장</h2><span>${opened} / ${OUT.length} 해금 · 누르면 갈아입어요</span></div><div class="lv-wardrobe">${wardrobe}</div></div>
        <div class="lv-sec"><div class="lv-sec-h"><h2>에피소드</h2><span>시즌 1 · 다음 업데이트에서 열려요</span></div><ol class="lv-eps">${eps}</ol></div>
      </section>`;
    },
    bind(el) {
      U.$$('[data-go]', el).forEach(b => b.onclick = () => App.go(b.dataset.go));
      U.$$('[data-wear]', el).forEach(b => b.onclick = () => { st().outfit = b.dataset.wear; Store.save(); App.render(); });
      U.$('#lv-play', el).onclick = () => App.startSet();
    }
  };

  // ---------- 선물 상점 ----------
  let tier = 0;
  // 오늘의 기분 = 취향 선물 힌트
  const MOOD = { macaron: '딜링 오래 했더니 단 게 당기네…', flower: '테이블에 꽃 하나 있으면 좋겠다.', book: '요즘 공부하고 싶은 게 많아요.', necklace: '요즘 목이 좀 허전한 것 같아.', dinner: '오늘은 좀 특별한 날이었으면.' };
  const Shop = {
    html() {
      const l = st();
      const liked = GIFTS.filter(g => g.pref === 'like' && tierOpen(g.tier));
      const hint = liked.length ? spick(liked, today()) : null;
      const tabs = [[0, '전체'], [1, '1티어'], [2, '2티어'], [3, '3티어']].map(([t, nm]) => `<button type="button" role="tab" class="lv-tab${tier === t ? ' on' : ''}" data-tier="${t}" aria-selected="${tier === t}">${nm}${t && !tierOpen(t) ? ' · 잠김' : ''}</button>`).join('');
      const cards = GIFTS.filter(g => !tier || g.tier === tier).map(g => {
        if (!tierOpen(g.tier)) return `<div class="lv-gift off">${icon('lock', 'lv-gift-ic')}<b>${U.esc(g.nm)}</b><small>${TIER_LV[g.tier]}단계 ‘${U.esc(LV[TIER_LV[g.tier]].nm)}’에서 열려요</small></div>`;
        const known = tasteKnown(g), f = dayFactor(g.id);
        return `<button class="lv-gift ${known ? g.pref : ''}" type="button" data-gift="${g.id}"><span class="lv-gift-top"><span class="lv-gift-ic">${icon(g.ic)}</span><span class="lv-pref">${known ? PREF[g.pref].nm : '?'}</span></span>
          <b>${U.esc(g.nm)}</b><span class="lv-gift-row"><span class="lv-price">칩 ${fmt(g.price)}</span><span class="lv-h">${known ? '하트 +' + heartsFor(g) : '하트 ?'}</span></span>${f < 1 ? `<small>오늘 ${l.day.m[g.id]}번 줌 · 효과 ${Math.round(f * 100)}%</small>` : ''}</button>`;
      }).join('');
      return `<section class="lv-screen">
        <div class="lv-shop-head"><div><span class="lv-eyebrow">GIFT SHOP</span><h1>선물 상점</h1></div><span class="lv-bal big">${icon('chip')}칩 ${fmt(l.chips)}</span></div>
        <div class="lv-mood"><img src="${thumb(l.outfit)}" alt="미나"><div><span>미나의 오늘 기분</span><p>“${U.esc(hint ? MOOD[hint.id] : '오늘은 뭘 받아도 좋을 것 같아요.')}”</p><small>취향에 맞는 선물은 하트 ×1.5 · 같은 선물은 하루 두 번째부터 효과가 줄어요</small></div></div>
        <div class="lv-tabs" role="tablist">${tabs}</div>
        <div class="lv-gifts">${cards}</div>
        <p class="lv-note">칩은 문제를 맞혀서만 모을 수 있고, 현금으로 바꾸거나 다른 사람에게 보낼 수 없어요.</p>
      </section>`;
    },
    bind(el) {
      U.$$('[data-tier]', el).forEach(b => b.onclick = () => { tier = +b.dataset.tier; App.render(); });
      U.$$('[data-gift]', el).forEach(b => b.onclick = () => confirmGive(b.dataset.gift));
    }
  };

  return { st, LV, OUT, GIFTS, calc, onCorrect, onSetEnd, checkLevel, give, heroImg, homeStrip, homeQuote, bubble, resultBlock, nextInfo, View, Shop };
})();
