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
  /** 다른 모드(저격 홀덤)의 보상 */
  function addReward(chips, heart) { gain(null, chips, heart); Store.save(); checkLevel(); }
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
      <div class="lv-strip-btns"><span class="lv-bal">${icon('chip')}${fmt(l.chips)}</span><button class="btn btn-line" type="button" data-go="sniper">저격 홀덤</button><button class="btn btn-line" type="button" data-go="shop">선물 상점</button></div></div>`;
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
            <div class="lv-hero-btns"><button class="btn btn-ink" type="button" data-go="shop">${icon('heart')}선물하기</button><button class="btn btn-line" type="button" id="lv-play">미나 테이블에 앉기</button><button class="btn btn-line" type="button" data-go="sniper">미나와 저격 홀덤</button><span class="lv-bal">${icon('chip')}칩 ${fmt(l.chips)}</span></div>
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

  // ---------- 라운드 시나리오(연애 시뮬레이션 장면) ----------
  // lv: [최소 단계, 최대 단계] · 대사: ['n', 내레이션] 또는 ['m', 미나] · {rival} = 이번 라운드 라이벌 이름
  // opts: [내 대사, 미나의 답, 하트] · hands: 핸드별 내레이션 · end: 라운드 결과별 미나의 마지막 말
  const SCENES = [
    { id: 'first-seat', lv: [0, 1], title: '첫 자리', place: '홀덤 라운지 · 밤 9시',
      intro: [['n', '라운지 문을 열자 칩 소리와 낮은 재즈가 섞여 흐른다.'], ['m', '처음 오셨죠? 이 자리, 딜러 바로 앞이라 잘 보여요.'], ['n', '맞은편 자리엔 {rival}. 벌써 칩을 만지작거리고 있다.']],
      q: '미나에게 뭐라고 할까?', opts: [['잘 부탁해요. 많이 배우러 왔어요.', '배우러 오셨구나. 그럼 제가 제대로 봐 드릴게요.', 3], ['오늘 딜러 운이 좋은 것 같은데요?', '…그런 말은 이기고 나서 해 주세요.', 1]],
      hands: ['미나가 첫 카드를 미끄러뜨리며 눈짓한다. ‘포지션부터 보세요.’', '두 번째 핸드. 미나가 작게 속삭인다. ‘천천히, 계산부터.’', '마지막 핸드. 카드를 돌리던 미나의 손끝이 잠깐 멈춘다.'],
      end: { perfect: '…전부 맞혔어요? 저 지금 좀 놀랐어요.', win: '오늘 처음 맞아요? 다음에도 이 자리 맡아 둘게요.', lose: '처음엔 다 그래요. 내일 또 오실 거죠?' } },
    { id: 'coffee-break', lv: [0, 2], title: '쉬는 시간', place: '라운지 뒤편 자판기 앞',
      intro: [['n', '쉬는 시간. 자판기 앞에서 미나와 마주쳤다.'], ['m', '어, 손님도 커피요? 여기 아메리카노 생각보다 괜찮아요.'], ['m', '다음 테이블 제가 들어가요. 같이 가요.']],
      q: '자판기 버튼 앞에서', opts: [['미나 씨 것도 제가 뽑을게요.', '…그럼 사양 안 할게요. 다음 판은 제가 잘 봐 드릴게요.', 3], ['저는 단 걸로 마실래요.', '단 거 좋아하세요? 저도요. 의외네.', 2]],
      hands: ['미나가 종이컵을 테이블 옆에 두고 카드를 섞는다.', '‘커피 식기 전에 끝내 봐요.’ 미나가 웃는다.', '남은 커피 한 모금. 미나가 마지막 카드를 돌린다.'],
      end: { perfect: '완벽해요. 커피 한 잔 더 뽑아 드릴까요?', win: '커피값은 한 거네요. 다음엔 제가 살게요.', lose: '커피 다 식었다. 다음 판은 더 집중하기예요.' } },
    { id: 'study', lv: [0, 2], title: '미나의 특강', place: '오픈 전 빈 테이블',
      intro: [['n', '오픈 전, 빈 테이블에 미나가 노트를 펼쳐 두었다.'], ['m', '일찍 오셨네요. 마침 잘됐다, 문제 몇 개 같이 볼래요?'], ['m', '맞히면… 음, 좋은 거 알려 드릴게요.']],
      q: '미나의 노트를 보며', opts: [['좋은 게 뭔데요?', '그건 맞히고 나서요. 비밀.', 2], ['선생님, 잘 부탁드립니다.', '선생님이래. …나쁘지 않네요.', 3]],
      hands: ['미나가 펜 끝으로 보드를 가리킨다. ‘여기서 뭐가 보여요?’', '‘좋아요, 다음 거.’ 미나가 노트를 넘긴다.', '‘마지막 문제. 이거 맞히면 진짜 알려 줄게요.’'],
      end: { perfect: '만점이에요. 비밀 두 개 알려 줘야겠다.', win: '약속대로. 저 사실 단 거 엄청 좋아해요. …이게 비밀이에요.', lose: '아쉽다. 비밀은 다음 특강 때.' } },
    { id: 'rude-guest', lv: [1, 2], title: '진상 손님', place: '라운지 VIP 테이블',
      intro: [['n', '맞은편의 {rival}, 미나에게 카드를 늦게 준다고 투덜댄다.'], ['m', '죄송해요, 바로 돌릴게요.'], ['n', '카드를 쥔 미나의 손이 살짝 떨린다.']],
      q: '어떻게 할까?', opts: [['딜러 탓 아니에요. 카드로 얘기하죠.', '(미나가 고개를 숙이며 작게 웃는다) …고마워요.', 4], ['조용히 게임에 집중한다.', '(미나가 안도한 듯 숨을 고른다)', 2]],
      hands: ['‘저 사람, 블러프 많이 해요.’ 미나가 입 모양으로만 말한다.', '{rival}의 칩이 거칠게 밀려 나온다. 미나가 당신을 본다.', '마지막 핸드. 미나가 조용히 응원하는 눈빛이다.'],
      end: { perfect: '저 사람 표정 봤어요? 오늘 제일 통쾌한 판이었어요.', win: '아까 진짜 멋있었어요. …단골 해 주실 거죠?', lose: '괜찮아요. 제 편 들어 준 것만으로 충분했어요.' } },
    { id: 'rain', lv: [1, 2], title: '비 오는 마감', place: '마감 30분 전 · 창밖엔 비',
      intro: [['n', '창밖으로 빗소리가 커진다. 손님이 하나둘 빠져나간다.'], ['m', '우산 가져오셨어요? 저 오늘 깜빡했는데.'], ['m', '마감 전 마지막 테이블이에요. 잘 부탁해요.']],
      q: '우산 얘기에', opts: [['제 우산 같이 써요.', '…정말요? 그럼 마감까지 기다려 주세요.', 4], ['편의점에서 하나 사다 드릴게요.', '에이, 괜찮아요. 마음만 받을게요.', 2]],
      hands: ['빗소리 사이로 카드 넘기는 소리가 또렷하다.', '미나가 창밖을 한 번 보고 다시 당신을 본다.', '마지막 핸드. ‘이거 끝나면 같이 나가요.’'],
      end: { perfect: '오늘 운 좋은 날이네요. …저도요.', win: '우산 하나에 둘은 좀 좁네요. 싫다는 건 아니고요.', lose: '비 그치면 다시 해요. 오늘은 같이 걸어가요.' } },
    { id: 'reserved', lv: [1, 2], title: '예약석', place: '늘 앉던 자리',
      intro: [['n', '늘 앉던 자리에 작은 메모가 놓여 있다. ‘예약석’.'], ['m', '아, 그거 제가 써 둔 거예요. 다른 사람이 앉을까 봐.'], ['n', '맞은편에는 처음 보는 얼굴, {rival}.']],
      q: '메모를 집어 들며', opts: [['저 기다렸어요?', '…조금요. 아주 조금.', 4], ['이 메모 가져가도 돼요?', '네? …마음대로 하세요.', 3]],
      hands: ['미나가 평소보다 조금 더 천천히 카드를 돌린다.', '‘오늘 핸드 좋아요?’ 미나가 묻는다.', '마지막 핸드. 미나가 메모 쪽을 힐끗 본다.'],
      end: { perfect: '예약석 주인답네요.', win: '내일도 예약석이에요. 꼭 와요.', lose: '져도 괜찮아요. 자리는 그대로 둘게요.' } },
    { id: 'cafe', lv: [3, 5], title: '퇴근 후 카페', place: '라운지 옆 작은 카페',
      intro: [['n', '퇴근한 미나가 유니폼 대신 니트 차림으로 나타났다.'], ['m', '기다렸어? 오늘은 손님 말고 그냥 너로 만나는 거야.'], ['m', '근데 나 포커 얘기밖에 할 줄 몰라. 문제 내도 돼?']],
      q: '미나가 냅킨을 펼친다', opts: [['좋아, 대신 맞히면 소원 하나.', '소원? …뭔데. 일단 맞혀 봐.', 4], ['오늘은 네 얘기 듣고 싶어.', '(미나가 컵을 만지작거린다) 그럼… 한 판 끝나고.', 3]],
      hands: ['미나가 냅킨에 보드를 그린다. ‘여기서 넌 뭐 해?’', '‘음, 그다음.’ 미나가 턱을 괸다.', '‘마지막. 이거 맞히면 소원 들어줄게.’'],
      end: { perfect: '다 맞혔네. 소원 두 개 해.', win: '소원 말해 봐. …아니, 다음에 말해. 아껴 둬.', lose: '소원은 다음에. 대신 커피는 내가 살게.' } },
    { id: 'late-shift', lv: [3, 4], title: '새벽 근무', place: '새벽 2시의 라운지',
      intro: [['m', '졸려… 너 아니었으면 벌써 잤을 거야.'], ['n', '미나가 하품을 참으며 카드를 섞는다.'], ['n', '맞은편 {rival}도 눈이 반쯤 감겨 있다.']],
      q: '졸린 미나에게', opts: [['커피 사 올까?', '아니, 그냥 여기 있어. 그게 더 잠 깨.', 4], ['졸리면 내가 딜 할까?', '너 딜 하면 다 네 칩 되는 거 아냐? 안 돼.', 3]],
      hands: ['‘첫 핸드. 졸려도 계산은 정확하게.’', '미나가 볼을 톡톡 두드리며 정신을 차린다.', '‘마지막. 이거 끝나면 같이 아침 먹자.’'],
      end: { perfect: '잠 다 깼어. 너 때문에.', win: '아침은 내가 쏜다. 이긴 사람 특권.', lose: '졸려서 그래. 아침 먹고 다시 해.' } },
    { id: 'rival-duel', lv: [3, 5], title: '라이벌의 도발', place: '라운지 하이롤러 테이블',
      intro: [['n', '{rival}, 미나에게 노골적으로 말을 건다.'], ['m', '(작게) 신경 쓰지 마. 그냥 카드로 이겨.'], ['n', '이번 라운드, 질 수 없다.']],
      q: '{rival}을 보며', opts: [['미나는 내 딜러야.', '(미나 얼굴이 빨개진다) …딜러만?', 5], ['말 대신 칩으로 보여 줄게.', '그래, 그게 너답다.', 4]],
      hands: ['{rival}의 첫 베팅. 미나가 너만 보이게 고개를 끄덕인다.', '‘침착해.’ 미나의 입 모양.', '마지막 핸드. 라운지가 조용해진다.'],
      end: { perfect: '완벽해. 오늘 너 진짜 반칙이다.', win: '봤지? 다음부턴 아무도 너한테 못 덤벼.', lose: '괜찮아. 난 네 편이야, 어차피.' } },
    { id: 'han-river', lv: [4, 5], title: '한강 야경', place: '한강 공원 · 밤',
      intro: [['n', '강바람이 차다. 미나가 소매 끝을 잡아당긴다.'], ['m', '나 예전에 대회 나갔던 거 말했던가?'], ['m', '…나중에 얘기할게. 오늘은 그냥 같이 있자.']],
      q: '바람이 분다', opts: [['외투를 벗어 걸쳐 준다.', '(미나가 외투에 얼굴을 반쯤 묻는다) …따뜻하다.', 5], ['다시 대회 나가 보는 건 어때?', '…생각해 볼게. 너랑 연습하면 될지도.', 4]],
      hands: ['미나가 휴대폰으로 핸드 하나를 보여 준다. ‘이거, 내가 졌던 거.’', '‘너라면 어떻게 했을 것 같아?’', '강 건너 불빛이 흔들린다. 마지막 핸드.'],
      end: { perfect: '다음 대회, 같이 가 줄래?', win: '…역시 너한테 물어보길 잘했다.', lose: '괜찮아. 나도 그때 똑같이 했거든.' } },
    { id: 'final-memory', lv: [4, 5], title: '파이널 테이블의 기억', place: '미나의 집 앞 계단',
      intro: [['n', '미나가 처음으로 그날 이야기를 꺼냈다.'], ['m', '파이널 테이블이었어. 버블 직전에 콜 하나 잘못해서 다 끝났지.'], ['m', '그 뒤로 테이블 맞은편에 앉는 게 무서웠어.']],
      q: '미나의 이야기에', opts: [['그 핸드, 같이 다시 보자.', '…응. 너랑이면 볼 수 있을 것 같아.', 5], ['그때의 너도 멋있었을 거야.', '바보. …고마워.', 4]],
      hands: ['‘이 상황이었어. 스택은 이 정도.’ 미나가 숨을 고른다.', '‘여기서 난 콜 했어. 넌?’', '마지막 핸드. 미나가 네 손을 잠깐 잡는다.'],
      end: { perfect: '…이제 그 핸드 안 무서워.', win: '그때 네가 옆에 있었으면 좋았을 텐데.', lose: '봐, 쉬운 거 아니지? 나만 바보 아니었어.' } },
    { id: 'eve', lv: [5, 5], title: '대회 전날 밤', place: '라운지 마감 후',
      intro: [['m', '내일 대회야. 손이 떨려.'], ['m', '마지막으로 같이 한 번만 풀어 줘. 너랑 풀면 괜찮아지거든.']],
      q: '떨리는 미나에게', opts: [['넌 이미 충분히 강해.', '…그 말 듣고 싶었어.', 5], ['내일 응원하러 갈게.', '진짜? 맨 앞줄에 앉아.', 5]],
      hands: ['미나가 칩을 쌓았다 무너뜨린다. ‘첫 핸드.’', '‘좋아, 감 돌아오는 것 같아.’', '마지막 핸드. 미나가 눈을 감았다 뜬다.'],
      end: { perfect: '이제 하나도 안 떨려. 고마워.', win: '내일, 이기고 올게. 기다려.', lose: '연습에서 지는 게 낫지. 내일은 안 져.' } },
    { id: 'confession', lv: [5, 5], title: '당신의 핸드', place: '텅 빈 라운지 · 새벽',
      intro: [['n', '모두 떠난 라운지. 테이블엔 카드 두 장이 엎어져 있다.'], ['m', '이건 네 핸드야. 열어 보기 전에, 나 할 말 있어.'], ['m', '…세 판 다 끝나면 말할게.']],
      q: '미나의 눈을 보며', opts: [['나도 할 말 있어.', '(미나가 웃는다) 그럼 누가 먼저 할지 카드로 정하자.', 5], ['기다릴게. 천천히.', '…넌 항상 그렇게 기다려 주더라.', 5]],
      hands: ['미나가 첫 카드를 뒤집는다. 손끝이 조금 떨린다.', '‘두 번째.’ 목소리가 작다.', '마지막 카드. 미나가 숨을 들이쉰다.'],
      end: { perfect: '좋아해. 네가 앉는 테이블이면 어디든 갈게.', win: '좋아해. …이 말 하려고 오늘 딜 했어.', lose: '결과는 상관없어. 좋아해, 그 말이 하고 싶었어.' } }
  ];
  const sceneById = id => SCENES.find(s => s.id === id);
  const rivalName = set => { try { return Fun.byId(set.rival).n; } catch (e) { return '낯선 손님'; } };
  const fillR = (s, set) => String(s).replace(/\{rival\}/g, rivalName(set));
  /** 단계에 맞는 장면 중 덜 본 것을 고른다 */
  function pickScene() {
    const l = st(); l.seen = l.seen || {};
    const pool = SCENES.filter(s => l.lv >= s.lv[0] && l.lv <= s.lv[1]);
    const min = Math.min(...pool.map(s => l.seen[s.id] || 0));
    const cand = pool.filter(s => (l.seen[s.id] || 0) === min && s.id !== l.lastScene);
    const list = cand.length ? cand : pool;
    return list[Math.floor(Math.random() * list.length)];
  }
  /** 라운드 시작 장면(비주얼 노벨) */
  function scene(set) {
    const s = pickScene(), l = st();
    set.scene = s.id; l.seen = l.seen || {}; l.seen[s.id] = (l.seen[s.id] || 0) + 1; l.lastScene = s.id; Store.save();
    const steps = s.intro.map(([w, t]) => ({ w, t: fillR(t, set) }));
    let i = 0, picked = null;
    const v = Layer.open(`<div class="vn" role="document"><div class="vn-img"><img src="${big(l.outfit)}" alt="미나"><span class="vn-place">${U.esc(s.place)}</span><span class="vn-ep">EPISODE · ${U.esc(s.title)}</span></div>
      <div class="vn-box"><div class="vn-body" id="vn-body"></div><div class="vn-act" id="vn-act"></div></div></div>`, '라운드 장면');
    const body = U.$('#vn-body', v), act = U.$('#vn-act', v);
    const say = (w, t) => `<b class="vn-who ${w === 'm' ? 'm' : w === 'me' ? 'me' : 'n'}">${w === 'm' ? '미나' : w === 'me' ? '나' : ''}</b><p class="vn-text ${w}">${U.esc(t)}</p>`;
    const start = () => { Layer.close(); if (picked) { gain(set, 0, picked[2]); Store.save(); checkLevel(); } App.render(); };
    function draw() {
      if (i < steps.length) {
        body.innerHTML = say(steps[i].w, steps[i].t);
        act.innerHTML = `<button class="vn-skip" type="button" id="vn-skip">건너뛰기</button><button class="btn btn-ink" type="button" id="vn-next">다음 ▸</button>`;
        U.$('#vn-next', v).onclick = () => { i++; draw(); };
        U.$('#vn-skip', v).onclick = () => { i = steps.length; draw(); };
        U.$('#vn-next', v).focus();
      } else if (!picked) {
        body.innerHTML = `<b class="vn-who n">${U.esc(fillR(s.q, set))}</b>`;
        act.innerHTML = `<div class="vn-opts">${s.opts.map((o, k) => `<button class="vn-opt" type="button" data-k="${k}">${U.esc(fillR(o[0], set))}</button>`).join('')}</div>`;
        U.$$('[data-k]', v).forEach(b => b.onclick = () => { picked = s.opts[+b.dataset.k]; set.choice = +b.dataset.k; draw(); });
        U.$('[data-k]', v).focus();
      } else {
        body.innerHTML = say('me', fillR(picked[0], set)) + say('m', fillR(picked[1], set));
        act.innerHTML = `<span class="lv-tag heart">${icon('heart')}하트 +${picked[2]}</span><button class="btn btn-ink" type="button" id="vn-go">테이블에 앉기 ▸</button>`;
        U.$('#vn-go', v).onclick = start; U.$('#vn-go', v).focus();
      }
    }
    draw();
  }
  /** 풀이 화면: 이번 핸드의 장면 내레이션 */
  function storyLine(set) {
    const s = set && set.scene && sceneById(set.scene); if (!s) return '';
    const t = fillR(s.hands[Math.min(set.idx, s.hands.length - 1)], set);
    return `<div class="lv-scene-line"><img src="${thumb(st().outfit)}" alt="미나"><div><span>EPISODE · ${U.esc(s.title)} · ${U.esc(s.place)}</span><p>${U.esc(t)}</p></div></div>`;
  }
  /** 결과 화면: 장면 엔딩 */
  function sceneEnd(set) {
    const s = set && set.scene && sceneById(set.scene); if (!s || !set.fun) return '';
    const k = set.fun.perfect ? 'perfect' : set.fun.win ? 'win' : 'lose';
    return `<div class="lv-ending ${k}"><img src="${big(st().outfit)}" alt="미나"><div class="lv-ending-tx"><span class="lv-eyebrow">EPISODE · ${U.esc(s.title)} · ${k === 'perfect' ? 'PERFECT ENDING' : k === 'win' ? 'GOOD ENDING' : 'NEXT TIME'}</span><p class="lv-say">“${U.esc(fillR(s.end[k], set))}”</p><small>${U.esc(s.place)}</small></div></div>`;
  }

  return { addReward, st, LV, OUT, GIFTS, SCENES, calc, onCorrect, onSetEnd, checkLevel, give, heroImg, homeStrip, homeQuote, bubble, resultBlock, nextInfo, scene, storyLine, sceneEnd, View, Shop };
})();
