/* ===== 재미 레이어: 라이벌 · 코믹 시나리오 · 업적 ===== */
const RIVAL_BASE = 'rivals/';
const Fun = (() => {
  // ---------- 도우미 ----------
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  /** 같은 문제·같은 라이벌이면 다시 그려도 같은 대사가 나오도록 시드로 고른다 */
  const spick = (a, seed) => a[hash(seed) % a.length];
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  /** 받침에 맞는 조사: josa('세라','이','가') → '세라가' */
  function josa(word, a, b) {
    const c = String(word).trim().slice(-1).charCodeAt(0);
    if (c < 0xac00 || c > 0xd7a3) return word + b;
    return word + ((c - 0xac00) % 28 ? a : b);
  }
  const img = r => RIVAL_BASE + 'r' + String(r.i).padStart(2, '0') + '.webp';
  const thumb = r => RIVAL_BASE + 't' + String(r.i).padStart(2, '0') + '.webp';

  // ---------- 라이벌 40명 ----------
  // ty: bluff 블러퍼 · rock 철벽 · maniac 공격형 · station 콜스테이션 · calc 계산형
  const TY = { bluff: '블러퍼', rock: '철벽', maniac: '공격형', station: '콜머신', calc: '계산형' };
  const R = [
    ['세라', '카드 부채질 장인', 'bluff', '부채질은 더워서 하는 거야. 블러프 아니야. 진짜로.'],
    ['미진', '엑셀로 팟오즈 계산하는 경리', 'calc', '팟오즈 23.8%. 소수점 둘째 자리에서 반올림했어.'],
    ['로즈', '레이즈 말고는 할 줄 모름', 'maniac', '체크? 그게 무슨 버튼이야?'],
    ['하나', '남의 칩도 내 칩이라 믿는 사람', 'maniac', '그 칩, 곧 내 앞으로 이사 올 거야.'],
    ['엘라', '취한 척하는 위스키 마담', 'bluff', '나 취했어~ (안 취함)'],
    ['유나', '졸린 척 넛을 든 새벽 세 시', 'rock', '하암… 나 지금 폴드할까 말까 졸려서… 아 올인.'],
    ['리리', '손키스로 틸트 유발', 'bluff', '쪽♡ 지금 흔들렸지? 그게 텔이야.'],
    ['나나', '카드 뒤에 숨는 포커페이스', 'rock', '(카드 뒤에서) …내 표정 못 봤지?'],
    ['지아', '녹색 테이블 보호색 위장', 'station', '나 여기 있었어. 처음부터. 콜.'],
    ['수아', '딜러 출신, 셔플만 3년', 'calc', '덱에 남은 아웃츠 9장. 다 세어 놨어.'],
    ['클로이', '블랙스완, 우아하게 올인', 'maniac', '우아하게, 그러나 전부.'],
    ['하린', '회계감사팀 출신 안경', 'calc', '당신의 콜, 감사(監査)하겠습니다.'],
    ['루비', '빨간 머리 칩 불도저', 'maniac', '칩은 밀라고 있는 거야. 밀어!'],
    ['셀린', '은발 여왕, 키스 날리고 3벳', 'bluff', '키스는 서비스, 3벳은 진심.'],
    ['지수', '단발 스나이퍼', 'rock', '한 발. 한 번. 그걸로 끝.'],
    ['소피', '레이스 커튼 뒤 매복러', 'rock', '여섯 시간 기다렸어. 이 한 판을 위해.'],
    ['민', '조끼 입은 칩 회수반', 'calc', '계산 끝났어. 그 팟은 내 거야.'],
    ['앨리스', '골드러시 금발', 'station', '금은 캐는 거고, 콜은 하는 거야.'],
    ['서아', '에메랄드 반지 콜 요정', 'station', '궁금하면 콜. 안 궁금해도 콜.'],
    ['비비안', '이기기 전에 미리 건배', 'bluff', '건배~ 이 팟 축하주야. 아직 안 끝났지만.'],
    ['태오', '턱 괴고 지루한 척', 'rock', '하… 이 판 지루하네. (속으로 AA)'],
    ['태오', '카드 두 장 쥐고 폼 잡기', 'bluff', '내 카드? 궁금하면 콜해.'],
    ['태오', '칩 밀기 국가대표', 'maniac', '밀 때는 망설이면 안 돼.'],
    ['태오', '검은 셔츠 진지 모드', 'calc', '오늘은 장난 안 쳐. 계산만 해.'],
    ['태오', '카드로 입 가리는 텔 방지턱', 'rock', '입꼬리는 가렸다. 텔은 없다.'],
    ['태오', '실내에서 선글라스 낀 남자', 'bluff', '눈빛 읽히면 곤란하거든. (실내임)'],
    ['태오', '생각하는 척 장인', 'calc', '음… 생각 중이야. (이미 정함)'],
    ['태오', '건배사 제조기', 'station', '위하여! 그리고 콜!'],
    ['태오', '올인 손 미리 뻗기', 'maniac', '내 손은 이미 칩 위에 있어.'],
    ['태오', '폴드하고 야경 감상', 'rock', '난 폴드. 야경이 예쁘네.'],
    ['태준', '태오 쌍둥이 형, 더 공격적', 'maniac', '동생한테 이겼다고? 형은 다르다.'],
    ['태준', '쌍둥이 형, 카드로 얼굴 반 가림', 'bluff', '반만 보여 줄게. 반은 블러프야.'],
    ['태준', '쌍둥이 형, 칩 쌓기 집착', 'calc', '칩은 10개씩. 각 맞춰서. 팟도 각 맞춰서.'],
    ['태준', '쌍둥이 형, 블루 테이블 VIP', 'rock', '블루 테이블에선 내가 법이야.'],
    ['태준', '쌍둥이 형, 레드 테이블 감성', 'station', '빨간 테이블에선 콜이 국룰이지.'],
    ['태준', '쌍둥이 형, 선글라스 시즌2', 'bluff', '선글라스는 동생 거 빌렸어.'],
    ['태준', '쌍둥이 형, 칩 콕 찍기', 'calc', '이 칩 하나가 네 운명을 바꿀 거야.'],
    ['태준', '쌍둥이 형, 위스키 감별사', 'station', '위스키는 스트레이트, 콜도 스트레이트.'],
    ['태준', '쌍둥이 형, 카드 들고 공격 개시', 'maniac', '카드를 든 순간부터 전쟁이야.'],
    ['태준', '쌍둥이 형, 홍콩 야경 귀공자', 'rock', '이 야경만큼 내 레인지도 넓지. 아, 아니다. 좁다.']
  ].map(([n, t, ty, say], k) => ({ i: k + 1, id: 'r' + (k + 1), n, t, ty, say, fam: k >= 30 ? 'taejun' : k >= 20 ? 'taeo' : 'lady' }));
  const SHADES = ['r26', 'r36'];
  const byId = id => R.find(r => r.id === id) || R[0];

  // ---------- 성격별 대사 ----------
  const L = {
    intro: {
      bluff: ['내 표정만 보고 판단하면… 큰일 날 걸?', '진짜일까, 연기일까? 맞혀 봐.', '오늘 내 연기력, 아카데미 감이야.'],
      rock: ['나는 기다리는 사람이야. 네가 실수할 때까지.', '좋은 패 아니면 안 움직여. 근데 오늘 좋은 패만 와.', '조용히, 확실하게.'],
      maniac: ['칩 다 걸 준비 됐어? 나는 됐어.', '오늘 테이블은 내가 접수한다!', '폴드는 겁쟁이나 하는 거야!'],
      station: ['난 끝까지 따라간다. 리버까지. 영원히.', '네가 뭘 하든 콜. 그게 내 철학이야.', '궁금한 건 못 참아. 다 보고 갈 거야.'],
      calc: ['확률은 거짓말을 안 해. 너는?', '내 머릿속 계산기는 이미 돌아가고 있어.', '감으로 치는 사람, 제일 좋아해. 먹기 좋거든.']
    },
    facing: {
      bluff: ['그 베팅, 내가 진짜로 보여? 후후.', '쫄았지? 손이 떨리는데?', '콜하면 후회, 폴드하면 더 후회~'],
      rock: ['…(아무 말 없이 쳐다본다)', '나 이번엔 진짜야. 아마도.', '이 정도면 알 텐데?'],
      maniac: ['받아? 말아? 빨리빨리!', '고민하는 사이에 칩 더 올린다?', '용기 있으면 따라와!'],
      station: ['나도 맨날 콜하는데, 너도 콜해~', '같이 리버 보러 가자~', '여기서 접으면 궁금해서 잠 못 잘걸?'],
      calc: ['팟오즈 계산은 했고?', '필요 승률 몇 %인지 알아?', '숫자를 봐. 감정 말고.']
    },
    open: {
      bluff: ['체크하면 내가 훔쳐 갈 거야~', '먼저 움직여 봐. 연기 평가해 줄게.', '조용하네? 수상해.'],
      rock: ['네 차례야. 신중하게.', '나는 기다릴게. 언제까지나.', '실수 한 번이면 충분해.'],
      maniac: ['빨리 쳐! 안 치면 내가 친다!', '체크? 지루해서 하품 나온다~', '판 키우자, 판!'],
      station: ['베팅해도 나는 콜할 건데?', '얼마를 걸든 따라간다~', '밸류 뽑기 좋은 날이지, 응?'],
      calc: ['이 보드, 누구 레인지에 유리할까?', '베팅 크기도 실력이야.', '계산하고 움직여.']
    },
    hit: {
      bluff: ['크윽… 내 연기가 읽혔다고?!', '거짓말… 표정 관리 완벽했는데!', '아니, 그걸 어떻게 알았어?!'],
      rock: ['…제법이군.', '…인정. 한 번은.', '(카드를 살짝 구긴다)'],
      maniac: ['으아악! 내 칩!!', '이건 운이야! 운!', '다음 판엔 두 배로 간다!'],
      station: ['어? 내가 졌어? 다시, 다시!', '콜했는데 왜 졌지…?', '궁금했는데… 알고 싶지 않았어.'],
      calc: ['내 계산이… 틀렸다고?', '소수점 오차… 아니, 네가 잘한 거야.', '데이터에 추가해 둘게. 쳇.']
    },
    gloat: {
      bluff: ['후훗, 연기 대상은 나야~', '깜빡 속았지? 칩 잘 쓸게♡', '내 눈빛에 넘어왔구나~'],
      rock: ['기다린 보람이 있군.', '그러니까 신중하라 했잖아.', '…예상대로.'],
      maniac: ['봤지?! 밀어붙이면 이긴다!', '칩 고마워~ 바로 또 올인한다!', '하하하! 테이블은 내 거야!'],
      station: ['거봐, 콜하길 잘했지~', '리버까지 보니까 재밌지?', '궁금증 해결! 칩도 내 거!'],
      calc: ['확률대로 됐네.', '계산 안 하고 쳤지? 티 나.', '숫자는 거짓말 안 한다니까.']
    },
    lose: ['오늘은 내가 졌어. 다음엔 안 봐줘.', '크… 리벤지 매치 꼭 와.', '인정할게. 너 좀 치는구나.', '오늘 운세가 나빴던 거야. 그런 거야.'],
    win: ['한 판 더? 칩은 충분해?', '해설 꼼꼼히 읽고 다시 와~', '오늘은 내가 이겼다. 복습하고 와!', '다음엔 좀 더 버텨 봐.']
  };

  // ---------- 코믹 시나리오 문장 ----------
  const RANKS = '23456789TJQKA';
  function handClass(c) {
    if (!c || c.length < 4) return 'junk';
    const r1 = c[0], r2 = c[2], s = c[1] === c[3];
    const v1 = RANKS.indexOf(r1), v2 = RANKS.indexOf(r2), hi = Math.max(v1, v2), lo = Math.min(v1, v2);
    if (r1 === r2) return hi >= 10 ? 'bigpair' : 'pair';
    if (hi === 12 && lo >= 9) return 'bigace';
    if (hi === 12) return s ? 'suitedace' : 'weakace';
    if (lo >= 8) return 'broadway';
    if (s && hi - lo <= 2) return 'connector';
    return 'junk';
  }
  const HOOK = {
    bigpair: ['주머니 속에 로켓이… 표정 관리 들어갑니다.', '이 패 받고 웃으면 반칙입니다. 입꼬리 단속!', '프리미엄 페어 도착. 심장아, 진정해.'],
    pair: ['작은 페어. 귀엽지만 세트 되면 깡패가 됩니다.', '페어는 페어인데… 자신감은 반쯤만.', '보드에 큰 카드 깔리면 바로 쭈굴해지는 패.'],
    bigace: ['에이스에 그림 카드! 손이 근질근질합니다.', '좋은 패입니다. 너무 사랑에 빠지지만 마세요.', '이 패로 폴드하면 엄마가 운다는 그 패.'],
    suitedace: ['무늬 맞춘 에이스. 옷은 잘 입었는데 실력은?', '에이스는 에이스인데… 키커가 좀 수줍네요.', '플러시 꿈을 꾸게 만드는 패.'],
    weakace: ['에이스 들었다고 신나면 안 되는 그 패.', '에이스 하나 믿고 가기엔… 친구가 약합니다.', '에이스라는 이름값만 하는 패.'],
    broadway: ['그림 카드 두 장. 사진발은 좋은데.', '높은 카드 둘! 근데 그게 전부일 수도.', '얼굴(그림 카드)은 합격. 실속은 검토 중.'],
    connector: ['수딧 커넥터. 잘 되면 대박, 안 되면 추억.', '스트레이트·플러시 다 꿈꿀 수 있는 낭만 패.', '보드만 도와주면 무서운 패. 보드가 도와줄까?'],
    junk: ['이 패… 손에서 이상한 냄새가 납니다.', '카드가 당신을 보고 미안해하고 있습니다.', '받자마자 한숨 나오는 패. 그런데 정답은?']
  };
  const TOPIC = {
    '포지션별 시작 핸드': ['자리가 곧 권력! 오늘 당신의 자리는 {pos}.', '같은 패라도 자리 따라 운명이 바뀝니다.'],
    '기본 팟오즈': ['계산기 꺼내세요. 오늘은 수학 시간입니다.', '얼마 걸고 얼마 먹을 수 있는지, 장사꾼 마인드 ON.'],
    '체크와 밸류 베팅': ['좋은 패로 얼마나 뽑아 먹을지 고민할 시간.', '욕심은 적당히, 밸류는 확실히.'],
    '3벳 대응': ['누가 레이즈 위에 레이즈를 얹었습니다. 무례하네요.', '3벳 날아왔다! 맞설까, 비켜설까?'],
    '드로우의 콜 판단': ['한 장만 오면 되는데… 그 한 장이 늘 안 오죠.', '아웃츠 세는 시간. 손가락 준비!'],
    '베팅 크기': ['얼마를 걸지가 문제. 소심하게? 화끈하게?', '베팅 크기 하나로 상대 지갑이 열리고 닫힙니다.'],
    '턴 액션': ['턴 카드 투하! 분위기 급반전 가능 구간.', '턴에서 한 번 더 고민하는 자가 이깁니다.'],
    '상대 범위 추정': ['상대 머릿속 들여다보기 시간. 독심술 ON.', '상대가 뭘 들었을지 탐정 놀이 시작.'],
    '블러프 캐치': ['진짜일까, 연기일까? 오늘의 연기 대상 심사위원은 당신.', '상대의 뻥을 잡아낼 시간. 거짓말 탐지기 가동!'],
    '숏스택': ['칩이 다이어트 중입니다. 너무 빠졌어요.', '칩이 얼마 없습니다. 이제 승부를 걸어야 할 때.'],
    '버블과 ICM': ['한 명만 더 떨어지면 상금권! 심장 BPM 180.', '돈이 걸리면 칩 계산이 달라집니다. 무서운 버블 타임.']
  };
  const TOPIC_DEF = ['오늘도 한 판, 오늘도 한 수.', '테이블 위 작은 드라마가 시작됩니다.'];
  const OPEN = {
    pre: ['블라인드가 깔렸고, 모두의 시선이 당신에게 쏠립니다. (부담 백배)', '아직 아무도 움직이지 않았습니다. 첫 수는 당신 몫.'],
    facing: ['앞에서 누가 판을 키웠습니다. 지갑이 살짝 떨립니다.', '상대가 칩을 밀었습니다. 테이블 공기가 무거워집니다.', '판돈이 올라갔습니다. 이제 진짜 선택의 시간.'],
    idle: ['공이 당신에게 넘어왔습니다. 칠까, 말까?', '상대가 조용히 넘겼습니다. 이 침묵, 믿어도 될까요?', '당신 차례입니다. 주도권을 잡을 기회!']
  };
  const PROMPT = {
    facing: ['따라갈까, 도망갈까. 인생도 포커도 타이밍.', '콜 버튼이 당신을 유혹합니다. 넘어갈까요?', '폴드는 패배가 아니라 전략일 수도… 아닐 수도.'],
    idle: ['먼저 칠까, 지켜볼까. 주도권은 당신 손에.', '체크는 겸손, 베팅은 자신감. 오늘 당신은?', '조용히 갈까, 화끈하게 갈까?']
  };
  const VERDICT = {
    ok: ['정답! 머리 위에 전구가 켜졌습니다 💡', '나이스! 오늘 좀 치는데요?', '완벽한 선택. 상대가 카드를 씹어 먹을 기세.', '정답! 이 정도면 테이블의 공포.'],
    no: ['앗… 칩이 기부되었습니다.', '괜찮아요, 수업료 낸 셈 치죠.', '오답! 하지만 실패는 고수의 어머니.', '아깝다! 해설 보고 바로 복수하러 가요.']
  };

  // ---------- 상태 ----------
  function st() {
    const p = Store.S.p;
    const d = { streak: 0, best: 0, perfect: 0, sets: 0, met: {}, beat: {}, lost: {}, ach: {}, seen: false };
    p.fun = { ...d, ...(p.fun || {}) };
    return p.fun;
  }

  // ---------- 라이벌 고르기 ----------
  let nextRival = null;
  function peekNext() {
    if (nextRival) return byId(nextRival);
    const f = st(), last = f.last;
    const fresh = R.filter(r => !f.met[r.id] && r.id !== last);
    const pool = fresh.length && Math.random() < 0.75 ? fresh : R.filter(r => r.id !== last);
    nextRival = pool[Math.floor(Math.random() * pool.length)].id;
    return byId(nextRival);
  }
  function takeRival() { const r = peekNext(); nextRival = null; return r.id; }

  // ---------- 화면 조각 ----------
  const hearts = (n, hit) => Array.from({ length: n }, (_, k) => `<i class="${k < n - hit ? 'on' : ''}">♥</i>`).join('');
  function rivalOf(set) { return set && set.rival ? byId(set.rival) : null; }

  /** 풀이 화면 위쪽 라이벌 말풍선 */
  function banner(set, p, stt) {
    const r = rivalOf(set); if (!r) return '';
    const done = set.answers[set.idx];
    const hits = set.answers.filter(a => a && a.ok).length;
    const seed = p.id + r.id;
    let line, cls = '';
    if (done && done.ok) { line = spick(L.hit[r.ty], seed + 'h'); cls = 'hit'; }
    else if (done) { line = spick(L.gloat[r.ty], seed + 'g'); cls = 'gloat'; }
    else line = spick(stt.facing ? L.facing[r.ty] : L.open[r.ty], seed);
    return `<div class="rival-bar ${cls}"><button class="rb-face" type="button" data-rival="${r.id}" aria-label="${U.esc(r.n)} 프로필"><img src="${thumb(r)}" alt="" width="64" height="64"></button>
      <div class="rb-main"><div class="rb-top"><b>${U.esc(r.n)}</b><span>${U.esc(r.t)}</span><span class="rb-hp" aria-label="라이벌 체력 ${set.ids.length - hits}/${set.ids.length}">${hearts(set.ids.length, hits)}</span></div>
      <div class="rb-say">${U.esc(line)}</div></div>${done ? `<span class="rb-fx">${done.ok ? '-1 ♥' : '+칩'}</span>` : ''}</div>`;
  }

  /** 기존 시나리오 카드를 코믹 버전으로 */
  function story(p, stt, prog, set) {
    const A = x => TableView.amt(x, stt.bb, App.units());
    const r = rivalOf(set);
    const pos = PD.posName(stt.hero.k);
    const actions = stt.log.flatMap(l => l.evs).filter(e => e.t !== 'f');
    const seed = p.id + (r ? r.id : '');
    const hook = spick(HOOK[handClass(p.c)], seed + 'k');
    const topic = fill(spick(TOPIC[p.tp] || TOPIC_DEF, seed + 't'), { pos });
    const opening = spick(!actions.length ? OPEN.pre : stt.facing ? OPEN.facing : OPEN.idle, seed + 'o');
    const prompt = spick(stt.facing ? PROMPT.facing : PROMPT.idle, seed + 'p');
    const who = r ? `맞은편엔 ‘${U.esc(r.t)}’ <b>${U.esc(josa(r.n, '이', '가'))}</b> 앉아 있습니다. ` : '';
    return `<header class="hand-story comic">${set && set.rival ? banner(set, p, stt) : ''}<div class="story-top"><span>EPISODE · ${U.esc(p.tp)}</span><span>${U.esc(prog)} · ${PD.STREET_KO[stt.street]}</span></div>
      <h1>${U.esc(p.ti)}</h1><p class="story-hook">“${U.esc(hook)}”</p>
      <div class="story-intro">${stt.n}인 ${p.format === 'cash' ? '링게임' : '토너먼트'}. 당신은 <b>${pos}</b> 자리. ${who}유효 스택은 <b>${TableView.trimNum(stt.effBB)}BB</b>.<br>${U.esc(opening)}</div>
      <p class="story-topic">📌 ${U.esc(topic)}</p>
      ${p.ctx ? `<div class="story-context"><span>이 핸드의 상황</span><p>${U.esc(p.ctx)}</p></div>` : ''}
      <div class="story-facts"><div><span>내 핸드</span><b>${TableView.miniCards(stt.heroCards)}</b></div><div><span>현재 팟</span><b>${A(stt.total)}</b></div><div><span>${stt.facing ? '콜에 필요한 금액' : '현재 액션'}</span><b>${stt.facing ? A(Math.min(stt.toCall, stt.hero.stack)) : '체크 또는 베팅'}</b></div></div>
      <div class="story-prompt">${U.esc(prompt)}<span>테이블을 읽고, 당신의 액션을 선택하세요.</span></div></header>`;
  }
  const verdictLine = (ok, seed) => spick(ok ? VERDICT.ok : VERDICT.no, seed);

  // ---------- 업적 ----------
  const lvOf = id => { const q = PROBLEMS.find(x => x.id === id); return q ? q.lv : 0; };
  function stats() {
    const p = Store.S.p, f = st();
    const sol = Object.entries(p.solved || {});
    const lv = { 1: 0, 2: 0, 3: 0 };
    sol.forEach(([id, v]) => { if (v.ok) { const l = lvOf(id) || (App.byId(id) || {}).lv; if (lv[l] != null) lv[l]++; } });
    const met = Object.keys(f.met), beat = Object.keys(f.beat);
    return {
      c: p.tot.c, wrong: sol.filter(([, v]) => !v.ok).length, best: f.best, perfect: f.perfect, sets: f.sets,
      met: met.length, beat: beat.length, lv,
      taeo: met.filter(id => byId(id).fam !== 'lady').length,
      shades: SHADES.some(id => f.beat[id]) ? 1 : 0,
      twins: ['taeo', 'taejun'].every(fam => beat.some(id => byId(id).fam === fam)) ? 1 : 0
    };
  }
  // g: 그룹 · k: 통계 키 · n: 목표 · e: 아이콘
  const ACH = [
    ['c1', 'count', 'c', 1, '🐣', '첫 칩 냄새', '첫 정답. 칩 냄새가 고소합니다.'],
    ['c3', 'count', 'c', 3, '🍀', '초심자의 행운?', '정답 3개. 운인지 실력인지는 아직 모름.'],
    ['c5', 'count', 'c', 5, '🖐️', '손 풀렸다', '정답 5개. 이제 몸이 좀 풀렸네요.'],
    ['c10', 'count', 'c', 10, '🏠', '동네 홀덤 짱', '정답 10개. 동네에선 이제 적수가 없습니다.'],
    ['c20', 'count', 'c', 20, '🎮', 'PC방 전설', '정답 20개. 사장님이 당신 이름을 압니다.'],
    ['c30', 'count', 'c', 30, '🥂', '라운지 VIP', '정답 30개. 웰컴 드링크가 공짜입니다.'],
    ['c50', 'count', 'c', 50, '👑', '칩 리더의 향기', '정답 50개. 테이블이 당신을 경계합니다.'],
    ['c77', 'count', 'c', 77, '🎰', '럭키 세븐세븐', '정답 77개. 7이 두 개면 두 배로 럭키.'],
    ['c100', 'count', 'c', 100, '💯', '백전백승(진짜 100)', '정답 100개. 이건 운으로 안 됩니다.'],
    ['c150', 'count', 'c', 150, '🎓', '포커 박사(비공인)', '정답 150개. 학위증은 마음속에 있습니다.'],
    ['c200', 'count', 'c', 200, '✈️', '라스베이거스 출국 준비', '정답 200개. 여권 챙기세요.'],
    ['c250', 'count', 'c', 250, '🐉', '진정한 HOLDEM GOSU', '정답 250개. 당신이 바로 고수입니다.'],
    ['s3', 'streak', 'best', 3, '🔥', '3연속 콤보', '연속 3문제 정답.'],
    ['s5', 'streak', 'best', 5, '☄️', '손에 불붙음', '연속 5문제 정답. 손 조심하세요, 뜨거워요.'],
    ['s10', 'streak', 'best', 10, '🤖', '인간 솔버', '연속 10문제 정답. 혹시 기계세요?'],
    ['s20', 'streak', 'best', 20, '🧠', 'GTO가 나를 따라함', '연속 20문제 정답. 이론이 당신을 베낍니다.'],
    ['p1', 'perfect', 'perfect', 1, '✨', '퍼펙트 게임', '한 세트 3문제를 모두 정답.'],
    ['p5', 'perfect', 'perfect', 5, '💎', '깔끔 그 자체', '퍼펙트 세트 5번.'],
    ['p10', 'perfect', 'perfect', 10, '🏆', '무결점 플레이어', '퍼펙트 세트 10번.'],
    ['r1', 'rival', 'beat', 1, '🥊', '첫 격파', '라이벌을 처음으로 이겼습니다.'],
    ['r5', 'rival', 'beat', 5, '🗺️', '라운지 순회 공연', '서로 다른 라이벌 5명 격파.'],
    ['r10', 'rival', 'beat', 10, '⚔️', '도장 깨기', '서로 다른 라이벌 10명 격파.'],
    ['r20', 'rival', 'beat', 20, '🦁', '라운지의 지배자', '서로 다른 라이벌 20명 격파.'],
    ['r40', 'rival', 'beat', 40, '📖', '라이벌 도감 완성', '라이벌 40명을 모두 격파.'],
    ['m10', 'rival', 'met', 10, '🤝', '마당발', '라이벌 10명과 만났습니다.'],
    ['tw', 'rival', 'twins', 1, '👯', '쌍둥이 감별사', '태오와 태준, 두 형제를 모두 격파.'],
    ['sh', 'rival', 'shades', 1, '🕶️', '실내 선글라스 단속반', '선글라스 쓴 라이벌을 격파. 실내에선 벗으세요.'],
    ['t5', 'rival', 'taeo', 5, '🪞', '이 사람 아까 본 것 같은데', '태오·태준 형제를 5가지 버전으로 만났습니다.'],
    ['l1', 'level', 'lv1', 10, '🌱', '입문 졸업', '입문 문제 10개 정답.'],
    ['l2', 'level', 'lv2', 10, '🌿', '중급 돌파', '중급 문제 10개 정답.'],
    ['l3', 'level', 'lv3', 10, '🌳', '고급 클럽 입장', '고급 문제 10개 정답.'],
    ['w5', 'fun', 'wrong', 5, '💸', '수업료 납부 완료', '오답 5개. 배움에는 원래 돈이 듭니다.'],
    ['w20', 'fun', 'wrong', 20, '🧘', '멘탈 금강불괴', '오답 20개에도 포기하지 않는 멘탈.'],
    ['g10', 'fun', 'sets', 10, '☕', '단골손님', '세트 10번 완주. 자리 맡아 둘게요.']
  ].map(([id, g, k, n, e, nm, d]) => ({ id, g, k, n, e, nm, d }));
  const GROUPS = { count: '정답 수', streak: '연속 정답', perfect: '퍼펙트', rival: '라이벌', level: '난이도', fun: '기타' };
  const val = (s, k) => (k.startsWith('lv') ? s.lv[k[2]] : s[k]) || 0;

  /** 새로 달성한 업적을 기록하고 돌려준다 */
  function check(silent) {
    const f = st(), s = stats(), now = Date.now(), out = [];
    ACH.forEach(a => { if (!f.ach[a.id] && val(s, a.k) >= a.n) { f.ach[a.id] = now; out.push(a); } });
    if (out.length) { Store.save(); if (!silent) out.forEach(a => queuePop(a)); }
    return out;
  }
  /** 현재 칭호: 달성한 정답 수 업적 중 가장 높은 것 */
  function title() {
    const f = st(); const got = ACH.filter(a => a.g === 'count' && f.ach[a.id]);
    return got.length ? got[got.length - 1] : null;
  }
  function nextCountGoal() { const f = st(); return ACH.find(a => a.g === 'count' && !f.ach[a.id]) || null; }

  // ---------- 업적 팝업 ----------
  const q = []; let showing = false;
  function queuePop(a) { q.push(a); if (!showing) popNext(); }
  function popNext() {
    const a = q.shift(); if (!a) { showing = false; return; }
    showing = true;
    const el = document.createElement('div');
    el.className = 'ach-pop'; el.setAttribute('role', 'status');
    el.innerHTML = `<span class="ap-ic">${a.e}</span><span><small>업적 달성!</small><b>${U.esc(a.nm)}</b><em>${U.esc(a.d)}</em></span>`;
    el.onclick = () => { el.remove(); App.go('ach'); };
    document.body.appendChild(el);
    confetti();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); popNext(); }, 350); }, 3000);
  }
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const g = ['♠', '♥', '♦', '♣', '★'];
    box.innerHTML = Array.from({ length: 26 }, (_, k) => `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .4}s;animation-duration:${1.4 + Math.random()}s;color:${['#f5c451', '#ff6b6b', '#7fb0ff', '#6fd39a', '#fff'][k % 5]}">${g[k % 5]}</i>`).join('');
    document.body.appendChild(box); setTimeout(() => box.remove(), 2800);
  }

  // ---------- 진행 연결 ----------
  /** 채점 세트 시작: 라이벌 배정 후 VS 화면 */
  function startSet(set) {
    if (set.mode === 'preview') return;
    set.rival = takeRival();
    const f = st(); f.last = set.rival;
    if (set.mode === 'scored') { f.met[set.rival] = (f.met[set.rival] || 0) + 1; Store.save(); }
    setTimeout(() => vs(set), 30);
  }
  function vs(set) {
    const r = byId(set.rival), f = st();
    const rec = `${f.beat[r.id] || 0}승 ${f.lost[r.id] || 0}패`;
    const v = Layer.open(`<div class="vs-card" data-ty="${r.ty}"><div class="vs-img"><img src="${img(r)}" alt="${U.esc(r.n)}"><span class="vs-badge">VS</span><span class="vs-type">${TY[r.ty]}</span></div>
      <div class="vs-body"><span class="vs-eyebrow">${set.mode === 'retry' ? '복습 스파링 상대' : '이번 라운드 라이벌'}</span><h2>${U.esc(r.n)} <small>${U.esc(r.t)}</small></h2>
      <p class="vs-say">“${U.esc(spick(L.intro[r.ty], r.id + Date.now()))}”</p>
      <div class="vs-meta"><span>라이벌 체력 <b class="rb-hp">${hearts(set.ids.length, 0)}</b></span><span>상대 전적 ${rec}</span></div>
      <p class="vs-rule">${set.ids.length}문제 중 ${Math.ceil(set.ids.length * 2 / 3)}문제 이상 맞히면 격파! 정답 하나에 하트 하나.</p>
      <button class="btn btn-brass btn-block" type="button" id="vs-go">한 판 붙자! 🃏</button></div></div>`, '라이벌 등장');
    const close = () => Layer.close();
    U.$('#vs-go', v).onclick = close; v.onclick = e => { if (e.target === v) close(); };
    U.$('#vs-go', v).focus();
  }
  /** 문제를 풀었을 때(채점 세트) */
  function onAnswer(set, ok, graded) {
    if (set.mode !== 'scored' || !graded) return;
    const f = st();
    f.streak = ok ? f.streak + 1 : 0; f.best = Math.max(f.best, f.streak);
    if (ok && [3, 5, 7, 10, 15, 20].includes(f.streak)) U.toast(`🔥 ${f.streak}연속 정답! 손이 뜨겁다!`);
    Store.save(); check();
  }
  /** 세트가 끝났을 때 결과 */
  function endSet(set) {
    if (!set.rival || set.funDone) return set.fun;
    set.funDone = true;
    const n = set.ids.length, okN = set.answers.filter(a => a && a.ok).length;
    const win = okN * 3 >= n * 2;
    const res = { win, okN, n, perfect: n >= 3 && okN === n };
    if (set.mode === 'scored') {
      const f = st(); f.sets++;
      if (win) f.beat[set.rival] = (f.beat[set.rival] || 0) + 1; else f.lost[set.rival] = (f.lost[set.rival] || 0) + 1;
      if (res.perfect) f.perfect++;
      Store.save(); check();
    }
    set.fun = res;
    return res;
  }
  function resultBlock(set) {
    if (!set || !set.rival || !set.fun) return '';
    const r = byId(set.rival), res = set.fun;
    const line = spick(res.win ? L.lose : L.win, r.id + res.okN);
    return `<div class="rival-result ${res.win ? 'win' : 'lose'}"><div class="rr-img"><img src="${img(r)}" alt="${U.esc(r.n)}"><span class="rr-stamp">${res.win ? (res.perfect ? 'PERFECT!' : '격파!') : '패배…'}</span></div>
      <div class="rr-body"><span class="eyebrow">${res.win ? 'RIVAL DEFEATED' : 'REMATCH?'}</span><h3>${res.win ? `${U.esc(josa(r.n, '을', '를'))} 이겼습니다!` : `${U.esc(josa(r.n, '이', '가'))} 이겼습니다`}</h3>
      <p class="rr-say"><b>${U.esc(r.n)}</b> “${U.esc(line)}”</p>
      <div class="rr-hp">라이벌 체력 <b class="rb-hp">${hearts(res.n, res.okN)}</b></div>
      ${set.mode === 'scored' ? `<button class="link" type="button" data-go="ach">${res.win ? '라이벌 도감에 등록됨 ↗' : '라이벌 도감 보기 ↗'}</button>` : ''}</div></div>`;
  }

  // ---------- 홈 조각 ----------
  function homeRival() {
    const r = peekNext(), f = st();
    return `<button class="hero-rival" type="button" data-rival="${r.id}" aria-label="다음 라이벌 ${U.esc(r.n)}"><img src="${img(r)}" alt=""><span class="hr-tag">NEXT RIVAL</span><span class="hr-name"><b>${U.esc(r.n)}</b>${U.esc(r.t)}</span><span class="hr-say">“${U.esc(r.say)}”</span>${f.met[r.id] ? '' : '<span class="hr-new">NEW</span>'}</button>`;
  }
  function homePanel() {
    const f = st(), t = title(), nx = nextCountGoal(), s = stats();
    const got = ACH.filter(a => f.ach[a.id]).length;
    const prog = nx ? Math.min(100, Math.round(s.c / nx.n * 100)) : 100;
    return `<div class="ach-panel"><span class="eyebrow">ACHIEVEMENTS</span><div class="ap-title"><span class="ap-medal">${t ? t.e : '🃏'}</span><div><small>현재 칭호</small><b>${t ? U.esc(t.nm) : '아직 칭호 없음'}</b></div></div>
      ${nx ? `<div class="ap-next"><span>다음 칭호 <b>${U.esc(nx.nm)}</b></span><span class="num">${s.c}/${nx.n}</span></div><div class="course-progress"><i style="width:${prog}%"></i></div>` : '<div class="ap-next"><span>모든 칭호를 모았습니다!</span></div>'}
      <div class="ap-row"><span>업적 <b class="num">${got}/${ACH.length}</b></span><span>격파한 라이벌 <b class="num">${s.beat}/${R.length}</b></span><span>최고 연속 <b class="num">${f.best}</b></span></div>
      <button class="btn btn-line btn-block" type="button" data-go="ach">업적 · 라이벌 도감 →</button></div>`;
  }

  // ---------- 업적 화면 ----------
  let tab = 'ach';
  const View = {
    html() {
      const f = st(), s = stats();
      const got = ACH.filter(a => f.ach[a.id]).length;
      const t = title();
      let inner;
      if (tab === 'ach') {
        inner = Object.entries(GROUPS).map(([g, nm]) => {
          const list = ACH.filter(a => a.g === g).map(a => {
            const v = Math.min(val(s, a.k), a.n), on = !!f.ach[a.id];
            return `<div class="ach ${on ? 'on' : ''}"><span class="ach-ic">${on ? a.e : '🔒'}</span><div class="ach-tx"><b>${U.esc(a.nm)}</b><span>${U.esc(a.d)}</span>${on ? `<em>${fmtDate(f.ach[a.id])} 달성</em>` : `<div class="ach-bar"><i style="width:${Math.round(v / a.n * 100)}%"></i></div><em class="num">${v} / ${a.n}</em>`}</div></div>`;
          }).join('');
          return `<div class="ach-group"><h3>${nm}</h3><div class="ach-list">${list}</div></div>`;
        }).join('');
      } else {
        inner = `<div class="dex">${R.map(r => {
          const met = f.met[r.id], beat = f.beat[r.id];
          return `<button type="button" class="dex-c ${beat ? 'beat' : met ? 'met' : 'lock'}" data-rival="${r.id}" aria-label="${met ? U.esc(r.n) : '아직 만나지 않은 라이벌'}"><img src="${thumb(r)}" alt="" loading="lazy"><span class="dex-n">${met ? U.esc(r.n) : '???'}</span>${beat ? '<span class="dex-s">격파</span>' : ''}<span class="dex-no num">No.${String(r.i).padStart(2, '0')}</span></button>`;
        }).join('')}</div><p class="small muted" style="margin:0">문제 세트를 시작하면 라이벌이 나타납니다. 3문제 중 2문제 이상 맞히면 격파!</p>`;
      }
      return `<section class="screen ach-screen">
        <div class="spread"><div><div class="eyebrow">업적</div><h2 class="title">${tab === 'ach' ? '업적' : '라이벌 도감'}</h2></div>
        <div class="tabs" role="tablist"><button type="button" role="tab" data-t="ach" aria-selected="${tab === 'ach'}">업적</button><button type="button" role="tab" data-t="dex" aria-selected="${tab === 'dex'}">라이벌 도감</button></div></div>
        <div class="ach-hero"><span class="ap-medal">${t ? t.e : '🃏'}</span><div><small>현재 칭호</small><b>${t ? U.esc(t.nm) : '첫 정답을 맞혀 칭호를 받으세요'}</b></div>
          <div class="ach-hero-n num"><div><b>${got}</b><span>/${ACH.length} 업적</span></div><div><b>${s.beat}</b><span>/${R.length} 격파</span></div><div><b>${s.c}</b><span>정답</span></div></div></div>
        ${inner}
      </section>`;
    },
    bind(el) {
      U.$$('[data-t]', el).forEach(b => b.onclick = () => { tab = b.dataset.t; App.render(); });
    }
  };
  function profile(id) {
    const r = byId(id), f = st();
    if (!f.met[id] && App.ui.view === 'ach') { U.toast('아직 만나지 않은 라이벌입니다. 문제를 풀면 만날 수 있어요!'); return; }
    const v = Layer.open(`<div class="vs-card" data-ty="${r.ty}"><div class="vs-img"><img src="${img(r)}" alt="${U.esc(r.n)}"><span class="vs-type">${TY[r.ty]}</span></div>
      <div class="vs-body"><span class="vs-eyebrow">No.${String(r.i).padStart(2, '0')} · 라이벌 프로필</span><h2>${U.esc(r.n)} <small>${U.esc(r.t)}</small></h2>
      <p class="vs-say">“${U.esc(r.say)}”</p>
      <div class="vs-meta"><span>만난 횟수 ${f.met[id] || 0}</span><span>상대 전적 ${f.beat[id] || 0}승 ${f.lost[id] || 0}패</span></div>
      <button class="btn btn-line btn-block" type="button" id="vs-go">닫기</button></div></div>`, r.n + ' 프로필');
    U.$('#vs-go', v).onclick = Layer.close; v.onclick = e => { if (e.target === v) Layer.close(); };
  }
  // 라이벌 얼굴을 누르면 프로필(위임)
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-rival]');
    if (b && !e.target.closest('.veil')) { e.preventDefault(); profile(b.dataset.rival); }
  });

  return { R, ACH, byId, banner, story, verdictLine, startSet, onAnswer, endSet, resultBlock, homeRival, homePanel, View, check, st, title };
})();
