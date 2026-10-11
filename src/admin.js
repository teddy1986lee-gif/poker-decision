/* ===== 관리자 페이지 ===== */
const TOPICS = ['포지션별 시작 핸드', '기본 팟오즈', '체크와 밸류 베팅', '3벳 대응', '드로우의 콜 판단', '베팅 크기', '턴 액션', '상대 범위 추정', '블러프 캐치', '숏스택', '버블과 ICM'];
const Admin = (() => {
  const ui = { tab: 'bank', sel: null, f: { lv: 'all', rv: 'all', q: '' }, ed: null, msg: '' };
  const S = Store.S;
  const shared = () => S.db && S.canEdit;
  const where = () => shared() ? '변경 사항은 공유 저장소에 저장되어 모든 이용자에게 바로 적용됩니다.'
    : S.db ? '편집 권한이 없어 보기만 할 수 있습니다.' : '공유 저장소가 연결되지 않아 변경 사항은 이 기기에만 저장됩니다.';
  const tabs = [['bank', '문제 관리'], ['new', '문제 등록'], ['set', '보상·랭킹 설정'], ['rev', '기록 검토'], ['stat', '통계']];

  function html() {
    return `<section class="screen">
      <div class="spread"><div><div class="eyebrow">관리자</div><h2 class="title">관리자 페이지</h2><div class="small muted">${where()}</div></div>
        <button class="btn btn-line" type="button" id="adm-home">홈으로</button></div>
      <div class="adm-tabs" role="tablist">${tabs.map(([k, t]) => `<button type="button" role="tab" data-at="${k}" aria-selected="${ui.tab === k}">${t}</button>`).join('')}</div>
      <div id="adm-body" style="display:grid;gap:14px">${body()}</div>
    </section>`;
  }
  function body() {
    return { bank: ui.sel ? detail : bankList, new: editor, set: settings, rev: review, stat: stats }[ui.tab]();
  }
  function bind(el) {
    U.$('#adm-home', el).onclick = () => App.go('home');
    U.$$('[data-at]', el).forEach(b => b.onclick = () => { ui.tab = b.dataset.at; ui.sel = null; ui.msg = ''; App.render(); });
    bindBody(el);
  }
  function bindBody(el) {
    ({ bank: ui.sel ? bindDetail : bindBank, new: bindEditor, set: bindSettings, rev: bindReview, stat: () => { } })[ui.tab](el);
  }
  function rerenderBody() { const b = U.$('#adm-body'); if (!b) return; b.innerHTML = body(); bindBody(U.$('#view')); }
  function refreshLive(what) {
    if (ui.tab === 'rev' || ui.tab === 'stat' || (ui.tab === 'bank' && !ui.sel)) rerenderBody();
  }

  // ---------- 문제 목록 ----------
  function bankList() {
    const all = App.bank();
    const cnt = k => all.filter(p => p.rv === k).length;
    const f = ui.f, q = f.q.trim().toLowerCase();
    const rows = all.filter(p => (f.lv === 'all' || p.lv === +f.lv) && (f.rv === 'all' || p.rv === f.rv) && (!q || (p.id + p.ti + p.tp).toLowerCase().includes(q)));
    const tr = rows.map(p => {
      let ans = '—';
      const errs = App.valid(p);
      if (!errs.length) { try { const st = PD.build(p); ans = App.ansOf(p).map(i => App.optLabel(st, p.o[i])).join(' / ') || '미정'; } catch (e) { } }
      return `<tr data-id="${U.esc(p.id)}"><td class="id">${U.esc(p.id)}</td><td>${App.lvPill(p.lv)}</td><td><b>${U.esc(p.ti)}</b><br><span class="small muted">${U.esc(p.tp)}${p.ex ? ' · 기획서 예시' : ''}${p.custom ? ' · 직접 등록' : ''}${S.edits[p.id] ? ' · 수정됨' : ''}</span></td><td class="small">${U.esc(ans)}</td><td>${errs.length ? '<span class="pill" style="color:var(--bad)">오류</span>' : App.rvPill(p.rv)}</td></tr>`;
    }).join('');
    return `<div class="kv num">
        <div><b>${all.filter(p => !p.ex).length}</b><span>출제 문제(입문 ${all.filter(p => p.lv === 1 && !p.ex).length} · 중급 ${all.filter(p => p.lv === 2 && !p.ex).length} · 고급 ${all.filter(p => p.lv === 3 && !p.ex).length})</span></div>
        <div><b>${cnt('draft')}</b><span>검수 대기</span></div><div><b>${cnt('ok')}</b><span>검수 완료</span></div><div><b>${cnt('fix') + cnt('hidden')}</b><span>수정 필요 · 비공개</span></div></div>
      <div class="filters"><select id="f-lv" aria-label="난이도"><option value="all">전체 난이도</option>${[1, 2, 3].map(l => `<option value="${l}" ${f.lv == l ? 'selected' : ''}>${LV[l].nm}</option>`).join('')}</select>
        <select id="f-rv" aria-label="검수 상태"><option value="all">전체 상태</option>${Object.entries(RV).map(([k, [t]]) => `<option value="${k}" ${f.rv === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <input id="f-q" type="search" placeholder="ID·제목·주제 검색" value="${U.esc(f.q)}" aria-label="검색"></div>
      <div class="panel scroll-x"><table class="ptable"><thead><tr><th>ID</th><th>난이도</th><th>문제</th><th>정답</th><th>상태</th></tr></thead><tbody>${tr || '<tr><td colspan="5" class="empty">조건에 맞는 문제가 없습니다.</td></tr>'}</tbody></table></div>
      <p class="small muted" style="margin:0">정답은 작성자의 추측만으로 확정하지 않습니다. 전문가 검수와 필요한 경우 솔버 분석 후 '검수 완료'로 바꾸세요. 설정에서 '검수 완료 문제만 출제'를 켜면 검수 완료 문제만 나갑니다.</p>`;
  }
  function bindBank(el) {
    U.$('#f-lv', el).onchange = e => { ui.f.lv = e.target.value; rerenderBody(); };
    U.$('#f-rv', el).onchange = e => { ui.f.rv = e.target.value; rerenderBody(); };
    const q = U.$('#f-q', el); let t; q.oninput = e => { clearTimeout(t); t = setTimeout(() => { if (!document.body.contains(q)) return; ui.f.q = e.target.value; rerenderBody(); const n = U.$('#f-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); };
    U.$$('tr[data-id]', el).forEach(r => r.onclick = () => { ui.sel = r.dataset.id; ui.msg = ''; rerenderBody(); window.scrollTo({ top: 0 }); });
  }

  // ---------- 문제 상세 · 검수 ----------
  function detail() {
    const p = App.byId(ui.sel);
    if (!p) { ui.sel = null; return bankList(); }
    const errs = App.valid(p);
    let st = null, svg = '';
    if (!errs.length) { st = PD.build(p); svg = TableView.render(st, { units: 'bb', label: p.ti }); }
    const ans = App.ansOf(p);
    const optRows = p.o.map((tok, i) => `<div class="field"><label class="ansbox"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-ans="${i}" ${ans.includes(i) ? 'checked' : ''} ${p.ex ? 'disabled' : ''}> <b>${U.esc(st ? App.optLabel(st, tok) : tok)}</b> <code class="tok">${U.esc(tok)}</code> 정답</span></label>
        <textarea data-note="${i}" aria-label="선택지 ${i + 1} 설명" placeholder="이 선택의 문제점 또는 보충 설명">${U.esc((p.n || [])[i] || '')}</textarea></div>`).join('');
    return `<div class="spread"><div class="row"><button class="btn btn-line" type="button" id="d-back">← 목록</button><span class="id" style="font:800 20px/1 var(--f-display)">${U.esc(p.id)}</span>${App.lvPill(p.lv)}${App.rvPill(p.rv)}</div>
        <div class="row">${!errs.length ? '<button class="btn btn-line" type="button" id="d-try">미리 풀기</button>' : ''}${p.custom ? '<button class="btn btn-line" type="button" id="d-edit">전체 수정</button><button class="btn btn-line" type="button" id="d-del">삭제</button>' : ''}</div></div>
      ${errs.length ? `<ul class="errs">${errs.map(e => `<li>${U.esc(e)}</li>`).join('')}</ul>` : ''}
      <div class="playgrid"><div style="display:grid;gap:10px;min-width:0"><h3 style="font-size:18px">${U.esc(p.ti)}</h3>
          <div class="tablewrap">${svg}</div>
          <div class="panel pad small" style="display:grid;gap:4px"><div><span class="muted">카드</span> <code class="tok">${U.esc(p.c)}</code> · <span class="muted">보드</span> <code class="tok">${U.esc(p.b || '없음')}</code></div><div><span class="muted">액션</span> <code class="tok">${U.esc(p.a || '(첫 행동)')}</code></div><div><span class="muted">블라인드</span> ${p.bl.join(' / ')} · <span class="muted">스택</span> ${U.esc(JSON.stringify(p.s))}</div></div></div>
        <div class="editor" style="min-width:0">
          <div class="field"><label for="d-rv">검수 상태</label><select id="d-rv">${Object.entries(RV).map(([k, [t]]) => `<option value="${k}" ${p.rv === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          ${p.ex ? '<p class="small muted" style="margin:0">기획서 예시 문제는 정답을 지정하지 않고 화면 구성 예시로만 씁니다.</p>' : ''}
          <div class="field"><label for="d-ctx">상황 설명(상대 성향·상금 구조)</label><textarea id="d-ctx" placeholder="필요할 때만 입력">${U.esc(p.ctx || '')}</textarea></div>
          <div class="field"><label for="d-w">권장 행동의 이유</label><textarea id="d-w" style="min-height:120px">${U.esc(p.w || '')}</textarea></div>
          <div class="eyebrow">선택지 · 정답 · 설명</div>${optRows}
          ${ui.msg}
          <button class="btn btn-ink" type="button" id="d-save">${shared() ? '저장하고 모두에게 적용' : '저장'}</button>
          <div id="d-confirm"></div>
        </div></div>`;
  }
  function bindDetail(el) {
    const p = App.byId(ui.sel); if (!p) return;
    U.$('#d-back', el).onclick = () => { ui.sel = null; ui.msg = ''; rerenderBody(); };
    const tr = U.$('#d-try', el); if (tr) tr.onclick = () => App.startPreview(p.id);
    U.$('#d-save', el).onclick = () => {
      const ans = U.$$('[data-ans]', el).filter(x => x.checked).map(x => +x.dataset.ans);
      if (!p.ex && !ans.length) { ui.msg = `<ul class="errs"><li>정답을 하나 이상 고르세요.</li></ul>`; return rerenderBody(); }
      const notes = U.$$('[data-note]', el).map(x => x.value.trim());
      const w = U.$('#d-w', el).value.trim(), ctx = U.$('#d-ctx', el).value.trim();
      const rv = U.$('#d-rv', el).value;
      const edits = { ...S.edits };
      edits[p.id] = { ...(edits[p.id] || {}), ans: p.ex ? null : (ans.length === 1 ? ans[0] : ans), w, n: notes, ctx: ctx || undefined };
      if (!edits[p.id].ctx) delete edits[p.id].ctx;
      Store.setAdmin('edits', edits);
      Store.setAdmin('review', { ...S.review, [p.id]: rv });
      ui.msg = `<div class="okmsg">${p.id} 저장됨 · ${RV[rv][0]}</div>`; rerenderBody();
    };
    const ed = U.$('#d-edit', el); if (ed) ed.onclick = () => { ui.ed = { ...S.custom[p.id] }; ui.tab = 'new'; ui.sel = null; App.render(); };
    const dl = U.$('#d-del', el); if (dl) dl.onclick = () => {
      U.$('#d-confirm', el).innerHTML = `<div class="panel pad row"><span class="small">${p.id}를 삭제할까요? 되돌릴 수 없습니다.</span><button class="btn btn-line" type="button" id="d-no">취소</button><button class="btn btn-ink" type="button" id="d-yes">삭제</button></div>`;
      U.$('#d-no', el).onclick = () => { U.$('#d-confirm', el).innerHTML = ''; };
      U.$('#d-yes', el).onclick = () => { Store.deleteCustom(p.id); ui.sel = null; rerenderBody(); U.toast(`${p.id} 삭제됨`); };
    };
  }

  // ---------- 문제 등록(에디터) ----------
  const blank = () => ({ id: '', lv: 1, tp: TOPICS[0], ti: '', pl: 9, bl: [500, 1000, 1000], s: 40, h: 'BTN', c: 'AsKd', b: '', a: 'f f f f f f', o: ['f', 'c', 'r2.2', 'a'], ans: 2, w: '', n: [], ctx: '' });
  function parseStack(def, txt) {
    const o = { d: +def || 40 };
    (txt || '').split(/[,\s]+/).filter(Boolean).forEach(kv => { const [k, v] = kv.split(':'); if (k && v && !isNaN(+v)) o[k.trim().toUpperCase().replace('UTG+1', 'U1')] = +v; });
    return Object.keys(o).length === 1 ? o.d : o;
  }
  const stackTxt = s => typeof s === 'number' ? '' : Object.entries(s).filter(([k]) => k !== 'd').map(([k, v]) => `${PD.posName(k)}:${v}`).join(', ');
  function nextId() { let n = 1; while (S.custom['N' + String(n).padStart(3, '0')]) n++; return 'N' + String(n).padStart(3, '0'); }
  function edProblem() {
    const e = ui.ed;
    const p = { id: e.id || nextId(), lv: +e.lv, tp: e.tp, ti: e.ti || '제목 없음', bl: e.bl.map(Number), s: e.s, h: e.h, c: e.c, b: e.b, a: e.a, o: e.o, ans: e.ans, w: e.w, n: e.n };
    if (+e.pl !== 8) p.pl = +e.pl;
    if (e.ctx) p.ctx = e.ctx;
    return p;
  }
  function editor() {
    if (!ui.ed) ui.ed = blank();
    const e = ui.ed;
    const posOpts = PD.POS[e.pl].map(k => `<option value="${k}" ${e.h === k ? 'selected' : ''}>${PD.posName(k)}</option>`).join('');
    return `<div class="playgrid"><form class="editor" id="ed" style="min-width:0">
        <div class="grid2">
          <div class="field"><label for="ed-lv">난이도</label><select id="ed-lv">${[1, 2, 3].map(l => `<option value="${l}" ${+e.lv === l ? 'selected' : ''}>${LV[l].nm}</option>`).join('')}</select></div>
          <div class="field"><label for="ed-tp">학습 주제</label><select id="ed-tp">${TOPICS.map(t => `<option ${e.tp === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="ed-ti">제목</label><input id="ed-ti" value="${U.esc(e.ti)}" placeholder="예: CO에서 KTo"></div>
        <div class="grid2">
          <div class="field"><label for="ed-pl">인원</label><select id="ed-pl">${[9, 8, 7, 6, 5, 4, 3].map(n => `<option ${+e.pl === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div class="field"><label for="ed-sb">SB</label><input id="ed-sb" type="number" inputmode="numeric" value="${e.bl[0]}"></div>
          <div class="field"><label for="ed-bb">BB</label><input id="ed-bb" type="number" inputmode="numeric" value="${e.bl[1]}"></div>
          <div class="field"><label for="ed-an">BB 앤티</label><input id="ed-an" type="number" inputmode="numeric" value="${e.bl[2]}"></div>
        </div>
        <div class="grid2">
          <div class="field"><label for="ed-sd">기본 스택(BB)</label><input id="ed-sd" type="number" inputmode="decimal" value="${typeof e.s === 'number' ? e.s : (e.s.d || 40)}"></div>
          <div class="field"><label for="ed-sx">스택 예외</label><input id="ed-sx" value="${U.esc(stackTxt(e.s))}" placeholder="BTN:22, BB:15"></div>
        </div>
        <div class="grid2">
          <div class="field"><label for="ed-h">내 포지션</label><select id="ed-h">${posOpts}</select></div>
          <div class="field"><label for="ed-c">내 카드</label><input id="ed-c" value="${U.esc(e.c)}" placeholder="AsKd"></div>
          <div class="field"><label for="ed-b">보드</label><input id="ed-b" value="${U.esc(e.b)}" placeholder="Kh7c2s"></div>
        </div>
        <div class="field"><label for="ed-a">액션 순서</label><input id="ed-a" value="${U.esc(e.a)}" placeholder="f f f f r2.2 c f f | b2 c | b2.7">
          <span class="hint">프리플랍 UTG부터 차례대로. <code class="tok">f</code> 폴드 <code class="tok">x</code> 체크 <code class="tok">c</code> 콜 <code class="tok">b2.5</code> 베팅(BB) <code class="tok">r7</code> 레이즈 총액(BB) <code class="tok">a</code> 올인 · 스트리트는 <code class="tok">|</code>로 구분 · 마지막은 내 차례 직전까지</span></div>
        <div class="field"><label for="ed-o">선택지</label><input id="ed-o" value="${U.esc(e.o.join(' '))}" placeholder="f c r7 a"><span class="hint">같은 표기로 2~5개. 상대 베팅이 없으면 체크·베팅, 있으면 폴드·콜·레이즈.</span></div>
        <div id="ed-opts" style="display:grid;gap:10px"></div>
        <div class="field"><label for="ed-w">권장 행동의 이유</label><textarea id="ed-w">${U.esc(e.w)}</textarea></div>
        <div class="field"><label for="ed-ctx">상황 설명(선택)</label><textarea id="ed-ctx" placeholder="상대 성향이나 상금 구조가 판단에 필요할 때">${U.esc(e.ctx || '')}</textarea></div>
        <div class="row"><button class="btn btn-ink" type="submit">${S.custom[e.id] ? '수정 저장' : '문제 등록'}</button><button class="btn btn-line" type="button" id="ed-reset">새로 작성</button></div>
        <div id="ed-msg">${ui.msg}</div>
      </form>
      <div style="display:grid;gap:10px;min-width:0" class="side"><div class="eyebrow">미리보기 · 자동 검증</div><div id="ed-prev"></div></div></div>`;
  }
  function readEditor(el) {
    const e = ui.ed, v = id => U.$('#' + id, el).value;
    e.lv = +v('ed-lv'); e.tp = v('ed-tp'); e.ti = v('ed-ti').trim();
    const pl = +v('ed-pl'); if (pl !== +e.pl) { e.pl = pl; if (!PD.POS[pl].includes(e.h)) e.h = 'BB'; }
    e.bl = [+v('ed-sb'), +v('ed-bb'), +v('ed-an')];
    e.s = parseStack(v('ed-sd'), v('ed-sx'));
    e.h = U.$('#ed-h', el).value; e.c = v('ed-c').replace(/\s/g, ''); e.b = v('ed-b').replace(/\s/g, '');
    e.a = v('ed-a').trim(); e.o = v('ed-o').trim().split(/\s+/).filter(Boolean);
    e.w = v('ed-w').trim(); e.ctx = v('ed-ctx').trim();
    const notes = U.$$('[data-ednote]', el); if (notes.length) e.n = notes.map(x => x.value.trim());
    const ans = U.$$('[data-edans]', el).filter(x => x.checked).map(x => +x.dataset.edans);
    if (U.$$('[data-edans]', el).length) e.ans = ans.length === 1 ? ans[0] : ans;
  }
  function paintPreview(el) {
    const p = edProblem(), { st, errs } = PD.validate(p);
    const prev = U.$('#ed-prev', el);
    let next = '';
    if (!st) { const m = /현재 (\S+)\)/.exec(errs[0] || ''); if (m) next = `<div class="small muted">다음 차례는 <b>${U.esc(m[1])}</b>입니다. 그 사람의 액션을 이어서 적으세요.</div>`; }
    prev.innerHTML = (st ? `<div class="tablewrap">${TableView.render(st, { units: 'bb', label: p.ti })}</div>` : '') + next +
      (errs.length ? `<ul class="errs">${errs.map(x => `<li>${U.esc(x)}</li>`).join('')}</ul>` : `<div class="okmsg">검증 통과 · 팟 ${TableView.amt(st.total, st.bb, 'bb')} · 콜 금액 ${TableView.amt(st.toCall, st.bb, 'bb')}</div>`);
    // 선택지별 정답·설명 칸
    const box = U.$('#ed-opts', el), ans = [].concat(ui.ed.ans ?? []);
    const sig = p.o.join('|');
    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig;
      box.innerHTML = p.o.map((tok, i) => {
        let lb = tok; try { if (st) lb = App.optLabel(st, tok); } catch (x) { }
        return `<div class="field"><label class="ansbox"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-edans="${i}" ${ans.includes(i) ? 'checked' : ''}> <b>${U.esc(lb)}</b> 정답</span></label><textarea data-ednote="${i}" aria-label="선택지 ${i + 1} 설명" placeholder="이 선택의 문제점">${U.esc((ui.ed.n || [])[i] || '')}</textarea></div>`;
      }).join('');
    }
  }
  function bindEditor(el) {
    const form = U.$('#ed', el);
    let t;
    form.oninput = form.onchange = ev => {
      if (ev.target.id === 'ed-pl') { readEditor(el); rerenderBody(); return; }
      clearTimeout(t); t = setTimeout(() => { if (!document.body.contains(form)) return; readEditor(el); paintPreview(el); }, 200);
    };
    U.$('#ed-reset', el).onclick = () => { ui.ed = blank(); ui.msg = ''; rerenderBody(); };
    form.onsubmit = ev => {
      ev.preventDefault(); readEditor(el);
      const p = edProblem(); const { errs } = PD.validate(p);
      if (errs.length) { U.$('#ed-msg', el).innerHTML = `<ul class="errs">${errs.map(x => `<li>${U.esc(x)}</li>`).join('')}</ul>`; return; }
      p.custom = true; Store.saveCustom(p);
      if (!S.review[p.id]) Store.setAdmin('review', { ...S.review, [p.id]: 'draft' });
      ui.ed = blank(); ui.msg = `<div class="okmsg">${p.id} 등록됨 · 검수 대기 상태로 저장했습니다.</div>`; rerenderBody();
    };
    paintPreview(el);
  }

  // ---------- 설정 ----------
  function settings() {
    const s = S.settings;
    const num = (id, label, val, hint) => `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="number" inputmode="numeric" min="0" value="${val}">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    const wk = Store.weekKey();
    return `<form class="editor" id="st">
      <div class="panel pad editor"><div class="eyebrow">이용권 · 광고</div><div class="grid2">
        ${num('s-free', '하루 무료 이용권', s.freePerDay)}${num('s-adr', '광고 1회 보상', s.adReward)}${num('s-adl', '광고 하루 한도', s.adDailyLimit, '0이면 제한 없음')}${num('s-ads', '광고 길이(초)', s.adSeconds)}${num('s-adk', '닫기 가능 시점(초)', s.adSkipAfter, '닫으면 보상 없음')}</div></div>
      <div class="panel pad editor"><div class="eyebrow">친구 초대</div><div class="grid2">${num('s-ivr', '초대 1회 보상', s.inviteReward)}${num('s-ivl', '초대 하루 한도', s.inviteDailyLimit, '기획안: 하루 3회, 최대 9문제')}</div></div>
      <div class="panel pad editor"><div class="eyebrow">출제 · 랭킹 기간</div>
        <label class="ansbox"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="s-only" ${s.onlyReviewed ? 'checked' : ''}> 검수 완료 문제만 출제</span></label>
        <div class="field"><label for="s-wk">주간 랭킹 시작</label><select id="s-wk"><option value="1" ${s.weekStart !== 0 ? 'selected' : ''}>월요일 0시(한국 시간)</option><option value="0" ${s.weekStart === 0 ? 'selected' : ''}>일요일 0시(한국 시간)</option></select><span class="hint num">현재 주간: ${wk} 시작</span></div></div>
      <div class="panel pad editor"><div class="eyebrow">광고 매출 추정</div>
        <div class="field"><label for="s-ecpm">실제 eCPM(원)</label><input id="s-ecpm" type="number" inputmode="numeric" min="0" value="${U.esc(s.ecpm)}" placeholder="광고사 확정 후 입력"><span class="hint">추정 매출 = 완료된 보상형 광고 노출 수 ÷ 1,000 × eCPM</span></div></div>
      <div class="panel pad editor"><div class="eyebrow">시험용</div>
        <label class="ansbox"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="s-fail" ${s.adFailSim ? 'checked' : ''}> 광고 불러오기 실패 상황 재현</span></label>
        <div class="row"><button class="btn btn-line" type="button" id="t-tix">내 무료 이용권 다시 채우기</button><button class="btn btn-line" type="button" id="t-reset">내 기록 초기화</button></div><div id="t-confirm"></div>
        <span class="hint">시험용 버튼은 지금 이 브라우저의 내 기록에만 적용됩니다.</span></div>
      ${ui.msg}
      <button class="btn btn-ink" type="submit">설정 저장</button></form>`;
  }
  function bindSettings(el) {
    U.$('#st', el).onsubmit = ev => {
      ev.preventDefault(); const v = id => U.$('#' + id, el).value;
      const n = (id, d) => { const x = Math.max(0, Math.floor(+v(id))); return isNaN(x) ? d : x; };
      const s = { ...S.settings, freePerDay: n('s-free', 3), adReward: n('s-adr', 3), adDailyLimit: n('s-adl', 0), adSeconds: Math.max(3, n('s-ads', 15)), adSkipAfter: n('s-adk', 5), inviteReward: n('s-ivr', 3), inviteDailyLimit: n('s-ivl', 3), onlyReviewed: U.$('#s-only', el).checked, weekStart: +v('s-wk'), ecpm: v('s-ecpm'), adFailSim: U.$('#s-fail', el).checked };
      Store.setAdmin('settings', s);
      ui.msg = `<div class="okmsg">설정을 저장했습니다.</div>`; rerenderBody();
    };
    U.$('#t-tix', el).onclick = () => { S.p.tix.free = S.settings.freePerDay; Store.save(); App.paintHeader(); U.toast(`무료 이용권 ${S.settings.freePerDay}개로 채움`); };
    U.$('#t-reset', el).onclick = () => {
      const c = U.$('#t-confirm', el);
      c.innerHTML = `<div class="row small">풀이 기록·포인트·이용권이 모두 지워집니다. <button class="btn btn-line" type="button" id="t-no">취소</button><button class="btn btn-ink" type="button" id="t-yes">초기화</button></div>`;
      U.$('#t-no', el).onclick = () => c.innerHTML = '';
      U.$('#t-yes', el).onclick = () => { const nick = S.p.nick, code = S.p.code; S.p = Store.fresh(); S.p.nick = nick; S.p.code = code; Store.save(true); c.innerHTML = ''; App.paintHeader(); U.toast('내 기록을 초기화했습니다'); };
    };
  }

  // ---------- 기록 검토 ----------
  function allRows() {
    const rows = Object.entries(S.players).map(([id, r]) => ({ id, ...r }));
    const meId = S.uid || 'me';
    if (S.p.nick) { const mine = { id: meId, ...Store.publicRow(S.p) }; const i = rows.findIndex(r => r.id === meId); if (i >= 0) rows[i] = mine; else rows.push(mine); }
    return rows;
  }
  function flagsFor(r) {
    const s = S.settings, f = [];
    if ((r.tc || 0) > (r.ta || 0)) f.push('정답 수가 풀이 수보다 많음');
    if ((r.ta || 0) >= 30 && (r.tc || 0) / r.ta >= 0.95) f.push('정답률 95% 이상(30회 이상)');
    const perDay = s.freePerDay + (s.adDailyLimit || 20) * s.adReward + s.inviteDailyLimit * s.inviteReward;
    if (r.wk === Store.weekKey() && (r.wa || 0) > perDay * 7) f.push(`주간 풀이 ${r.wa}회(가능 최대 약 ${perDay * 7}회)`);
    return f;
  }
  function review() {
    const ex = new Set(S.flags.excluded || []);
    const rows = allRows().sort((a, b) => flagsFor(b).length - flagsFor(a).length || (b.wc || 0) - (a.wc || 0));
    const tr = rows.map(r => {
      const fl = flagsFor(r), acc = U.pct(r.tc || 0, r.ta || 0);
      return `<tr><td><b>${U.esc(r.nick || '이름 없음')}</b>${ex.has(r.id) ? '<br><span class="small" style="color:var(--bad)">랭킹 제외됨</span>' : ''}</td><td class="num">${r.wk === Store.weekKey() ? (r.wc || 0) + ' / ' + (r.wa || 0) : '0 / 0'}</td><td class="num">${r.tc || 0} / ${r.ta || 0}</td><td class="num">${acc}%</td>
        <td class="small">${fl.length ? fl.map(x => `<span class="pill" style="color:var(--bad)">${U.esc(x)}</span>`).join(' ') : '<span class="muted">정상</span>'}</td>
        <td><button class="btn btn-line" type="button" data-ex="${U.esc(r.id)}" style="padding:6px 10px;font-size:12px">${ex.has(r.id) ? '복원' : '랭킹 제외'}</button></td></tr>`;
    }).join('');
    return `<p class="small muted" style="margin:0">자동 표시 기준: 정답 수가 풀이 수보다 많음 · 30회 이상 풀고 정답률 95% 이상 · 주간 풀이 수가 보상 한도로 가능한 최대치 초과. 표시된 기록은 확인 후 랭킹에서 제외할 수 있습니다.</p>
      <div class="panel scroll-x"><table class="ptable"><thead><tr><th>닉네임</th><th>이번 주 정답/풀이</th><th>누적 정답/풀이</th><th>정답률</th><th>표시</th><th></th></tr></thead><tbody>${tr || '<tr><td colspan="6" class="empty">아직 등록된 기록이 없습니다. 이용자가 닉네임으로 로그인해 문제를 풀면 여기에 나타납니다.</td></tr>'}</tbody></table></div>`;
  }
  function bindReview(el) {
    U.$$('[data-ex]', el).forEach(b => b.onclick = () => {
      const ex = new Set(S.flags.excluded || []); const id = b.dataset.ex;
      ex.has(id) ? ex.delete(id) : ex.add(id);
      Store.setAdmin('flags', { ...S.flags, excluded: [...ex] }); rerenderBody();
    });
  }

  // ---------- 통계 ----------
  function stats() {
    const rows = allRows();
    const sum = k => rows.reduce((a, r) => a + ((r.ctr || {})[k] || 0), 0);
    const tc = rows.reduce((a, r) => a + (r.tc || 0), 0), ta = rows.reduce((a, r) => a + (r.ta || 0), 0);
    const today = Store.dayKey();
    let can = 0, back = 0;
    rows.forEach(r => { const d = new Set(r.days || []); (r.days || []).forEach(x => { if (x >= today) return; can++; const nx = new Date(new Date(x + 'T00:00:00Z').getTime() + 864e5).toISOString().slice(0, 10); if (d.has(nx)) back++; }); });
    const rate = (a, b) => b ? `${Math.round(a / b * 100)}%` : '—';
    const adDone = sum('adDone'), ecpm = +S.settings.ecpm;
    const tiles = [
      ['3문제 완료율', rate(sum('setsDone'), sum('setsStarted')), `${sum('setsDone')} / ${sum('setsStarted')} 세트`],
      ['다음 3문제 재참여율', rate(sum('continued'), sum('offers')), `결과 화면 ${sum('offers')}회 중 이어서 ${sum('continued')}회`],
      ['광고 완료율', rate(adDone, sum('adStart')), `시작 ${sum('adStart')} · 완료 ${adDone} · 실패 ${sum('adFail')}`],
      ['초대 참여 완료율', rate(sum('invDone'), sum('linkCopies')), `링크 복사 ${sum('linkCopies')} · 참여 완료 ${sum('invDone')}`],
      ['정답률', rate(tc, ta), `정답 ${tc} / 첫 풀이 ${ta}`],
      ['다음 날 재방문율', rate(back, can), `방문일 ${can}일 중 다음 날 재방문 ${back}일`]
    ];
    return `<div class="kv num">${tiles.map(([k, v, s]) => `<div><span>${k}</span><b>${v}</b><span>${s}</span></div>`).join('')}</div>
      <div class="panel pad" style="display:grid;gap:6px"><div class="eyebrow">광고 매출 추정</div>
        <div class="num">완료된 보상형 광고 ${adDone.toLocaleString('ko-KR')}회 ÷ 1,000 × eCPM ${ecpm ? ecpm.toLocaleString('ko-KR') + '원' : '(미입력)'} = <b>${ecpm ? Math.round(adDone / 1000 * ecpm).toLocaleString('ko-KR') + '원' : '—'}</b></div>
        <span class="small muted">시제품의 광고는 모의 화면이라 실제 매출이 아닙니다. 광고사와 단가가 정해지면 eCPM을 입력하세요.</span></div>
      <p class="small muted" style="margin:0">${S.remoteOk ? `닉네임으로 로그인한 이용자 ${rows.length}명의 기록 기준입니다.` : '공유 저장소가 연결되지 않아 이 기기의 내 기록만 집계합니다.'}</p>`;
  }

  return { html, bind, refreshLive, ui };
})();
