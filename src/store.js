/* ===== 저장소: 이 기기(localStorage) + 공유 저장소(db) 동기화 ===== */
const Store = (() => {
  const LS = 'pd.progress.v1', LS_PREF = 'pd.pref.v1', LS_ADMIN = 'pd.admin.v1';
  const mem = {};
  const lsGet = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : (mem[k] || null); } catch (e) { return mem[k] || null; } };
  const lsSet = (k, v) => { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } };

  const DEFAULTS = { freePerDay: 3, adReward: 3, adDailyLimit: 0, adSeconds: 15, adSkipAfter: 5, inviteReward: 3, inviteDailyLimit: 3, weekStart: 1, onlyReviewed: false, ecpm: '', adFailSim: false };
  const S = {
    db: null, user: null, uid: null, canEdit: false, isOwner: false, runtime: false, remoteOk: false, readOnly: false,
    settings: { ...DEFAULTS }, review: {}, edits: {}, custom: {}, flags: { excluded: [] }, players: {}, invites: [],
    p: null, listeners: new Set()
  };

  // ---------- 날짜(KST) ----------
  const kst = (t = Date.now()) => new Date(t + 9 * 3600e3);
  const dayKey = (t) => kst(t).toISOString().slice(0, 10);
  function weekKey(t = Date.now()) {
    const d = kst(t); const wd = d.getUTCDay(); const back = (wd - (S.settings.weekStart ?? 1) + 7) % 7;
    return new Date(d.getTime() - back * 864e5).toISOString().slice(0, 10);
  }
  const randCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

  function fresh() {
    const t = Date.now();
    return {
      v: 1, nick: '', code: randCode(), created: t, upd: t,
      solved: {}, retry: {}, tot: { c: 0, a: 0, p: 0 }, wk: { k: weekKey(), c: 0, a: 0, p: 0 },
      tix: { day: dayKey(), free: S.settings.freePerDay, ad: 0, inv: 0 },
      adDay: { d: dayKey(), n: 0 }, invDay: { d: dayKey(), n: 0 }, credited: [], pendingInv: null, invitedBy: null, invSent: false,
      ctr: { setsStarted: 0, setsDone: 0, offers: 0, continued: 0, adStart: 0, adDone: 0, adFail: 0, linkCopies: 0, invDone: 0 },
      days: [dayKey()]
    };
  }
  /** 날짜·주간이 바뀌었으면 무료 이용권과 주간 기록을 새로 시작 */
  function roll(p) {
    const d = dayKey(), w = weekKey();
    let ch = false;
    if (p.tix.day !== d) { p.tix.day = d; p.tix.free = S.settings.freePerDay; ch = true; }
    if (p.adDay.d !== d) { p.adDay = { d, n: 0 }; ch = true; }
    if (p.invDay.d !== d) { p.invDay = { d, n: 0 }; ch = true; }
    if (p.wk.k !== w) { p.wk = { k: w, c: 0, a: 0, p: 0 }; ch = true; }
    if (!p.days.includes(d)) { p.days.push(d); p.days = p.days.slice(-40); ch = true; }
    return ch;
  }

  // ---------- 구독 ----------
  const emit = (what) => S.listeners.forEach(fn => { try { fn(what); } catch (e) { console.error(e); } });
  const on = fn => { S.listeners.add(fn); return () => S.listeners.delete(fn); };

  // ---------- 쓰기 큐(문서당 한 번에 하나) ----------
  const queues = {};
  function write(path, data, kind = 'set') {
    if (!S.db) return Promise.resolve(false);
    const q = queues[path] || (queues[path] = { busy: false, next: null });
    q.next = { data, kind };
    if (q.busy) return Promise.resolve(true);
    const run = async () => {
      q.busy = true;
      while (q.next) {
        const job = q.next; q.next = null;
        try {
          const ref = S.db.doc(path);
          if (job.kind === 'delete') await ref.delete(); else await ref.set(job.data);
        } catch (e) {
          if (e && (e.code === 'invalid_argument' || e.code === 'not_granted')) { if (path.startsWith('players') || path.startsWith('data/')) S.readOnly = true; emit('readonly'); }
          else if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 600 + Math.random() * 900)); if (!q.next) q.next = job; }
          else if (e && e.code === 'quota_exceeded') emit('quota');
          console.warn('db write', path, e && e.code);
        }
      }
      q.busy = false;
    };
    run();
    return Promise.resolve(true);
  }

  // ---------- 진행 기록 ----------
  let saveT = null;
  function save(now = false) {
    const p = S.p; p.upd = Date.now();
    lsSet(LS, p);
    clearTimeout(saveT);
    const go = () => {
      if (!S.db || !S.uid || S.readOnly) return;
      write(`data/users/${S.uid}/progress`, JSON.parse(JSON.stringify(p)));
      if (p.nick) write(`players/${S.uid}`, publicRow(p));
    };
    if (now) go(); else saveT = setTimeout(go, 700);
    emit('progress');
  }
  function publicRow(p) {
    return {
      nick: p.nick.slice(0, 16), code: p.code, wk: p.wk.k, wc: p.wk.c, wa: p.wk.a, wp: p.wk.p,
      tc: p.tot.c, ta: p.tot.a, tp: p.tot.p, ctr: p.ctr, days: p.days.slice(-14), upd: p.upd
    };
  }

  // ---------- 관리자 데이터(이 기기 사본) ----------
  function loadAdminLocal() {
    const a = lsGet(LS_ADMIN);
    if (a) { S.settings = { ...DEFAULTS, ...(a.settings || {}) }; S.review = a.review || {}; S.edits = a.edits || {}; S.custom = a.custom || {}; S.flags = a.flags || { excluded: [] }; }
  }
  const saveAdminLocal = () => lsSet(LS_ADMIN, { settings: S.settings, review: S.review, edits: S.edits, custom: S.custom, flags: S.flags });
  function setAdmin(key, value) {
    S[key] = value; saveAdminLocal();
    if (S.db && S.canEdit) {
      const docName = { settings: 'settings', review: 'review', edits: 'edits', flags: 'flags' }[key];
      if (docName) write(`config/${docName}`, JSON.parse(JSON.stringify(value)));
    }
    emit(key);
  }
  function saveCustom(prob) {
    S.custom[prob.id] = prob; saveAdminLocal();
    if (S.db && S.canEdit) write(`problems/${prob.id}`, JSON.parse(JSON.stringify(prob)));
    emit('custom');
  }
  function deleteCustom(id) {
    delete S.custom[id]; saveAdminLocal();
    if (S.db && S.canEdit) write(`problems/${id}`, null, 'delete');
    emit('custom');
  }

  // ---------- 초기화 ----------
  function initLocal() {
    S.runtime = !!(window.claude && typeof window.claude.use === 'function');
    loadAdminLocal();
    S.p = lsGet(LS) || fresh();
    S.p = { ...fresh(), ...S.p, ctr: { ...fresh().ctr, ...(S.p.ctr || {}) } };
    roll(S.p);
    lsSet(LS, S.p);
  }

  async function initRemote() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    S.runtime = true;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    S.user = user;
    if (user) {
      try { S.isOwner = await user.isOwner(); S.canEdit = await user.canEdit(); S.uid = await user.id(); } catch (e) { /* 읽기 실패 시 기본값 */ }
    }
    emit('who');
    if (!db) return;
    S.db = db; S.remoteOk = true;
    const err = e => console.warn('db listen', e && e.code);
    // 관리자 설정
    db.doc('config/settings').onSnapshot(s => { if (s.exists) { S.settings = { ...DEFAULTS, ...s.data() }; saveAdminLocal(); emit('settings'); } }, err);
    db.doc('config/review').onSnapshot(s => { if (s.exists) { S.review = { ...s.data() }; saveAdminLocal(); emit('review'); } }, err);
    db.doc('config/edits').onSnapshot(s => { if (s.exists) { S.edits = JSON.parse(JSON.stringify(s.data())); saveAdminLocal(); emit('edits'); } }, err);
    db.doc('config/flags').onSnapshot(s => { if (s.exists) { S.flags = { excluded: [], ...s.data() }; saveAdminLocal(); emit('flags'); } }, err);
    db.collection('problems').onSnapshot(q => { const c = {}; q.docs.forEach(d => { c[d.id] = JSON.parse(JSON.stringify(d.data())); }); S.custom = c; saveAdminLocal(); emit('custom'); }, err);
    db.collection('players').limit(1000).onSnapshot(q => { const m = {}; q.docs.forEach(d => { m[d.id] = d.data(); }); S.players = m; emit('players'); }, err);
    if (!S.uid) return;
    // 다른 기기의 기록 이어받기
    try {
      const snap = await db.doc(`data/users/${S.uid}/progress`).get();
      if (snap.exists) {
        const r = JSON.parse(JSON.stringify(snap.data()));
        const local = S.p;
        const localUsed = local.tot.a > 0 || local.nick;
        if (!localUsed || (r.upd || 0) >= (local.upd || 0)) {
          S.p = { ...fresh(), ...r, ctr: { ...fresh().ctr, ...(r.ctr || {}) } };
          if (local.pendingInv && !S.p.tot.a) S.p.pendingInv = local.pendingInv;
        }
      }
      roll(S.p); lsSet(LS, S.p);
      save(true);
    } catch (e) { console.warn('progress load', e && e.code); }
    // 내가 초대한 친구의 참여 완료
    db.collection('invites').where('inviter', '==', S.uid).onSnapshot(q => {
      S.invites = q.docs.map(d => ({ id: d.id, ...d.data() }));
      emit('invites');
    }, err);
    emit('progress');
  }

  // ---------- 선호(단위·테마 등, 이 기기 전용) ----------
  const pref = () => lsGet(LS_PREF) || { units: 'bb' };
  const setPref = (k, v) => { const p = pref(); p[k] = v; lsSet(LS_PREF, p); emit('pref'); };

  return { S, on, emit, save, roll, dayKey, weekKey, initLocal, initRemote, fresh, write, setAdmin, saveCustom, deleteCustom, pref, setPref, DEFAULTS, publicRow };
})();
