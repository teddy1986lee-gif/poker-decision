/* ===== 앱: 결과·보상 · 랭킹 · 기록 · 초대 · 로그인 · 모의 광고 ===== */
const Sx = Store.S;
const fmtDate = t => { const d = new Date(t + 9 * 3600e3); return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`; };
// 아티팩트에서는 게시 주소(SHARE_BASE), 일반 웹 호스팅에서는 현재 페이지 주소를 씁니다.
const shareBase = () => SHARE_BASE || (/^https?:$/.test(location.protocol) ? location.href.split('#')[0] : '');
const inviteLink = () => shareBase() + '#inv-' + Sx.p.code;

// ================= 결과 · 보상 =================
const Result = {
  html() {
    const set = App.ui.set || { answers: [], ids: [], empty: true };
    const s = Sx.settings, t = App.tickets();
    const scored = set.answers.filter(Boolean);
    const okN = scored.filter(a => a.ok).length;
    const pts = scored.filter(a => a.ok && a.first).length * POINTS;
    const adLeft = s.adDailyLimit ? Math.max(0, s.adDailyLimit - Sx.p.adDay.n) : null;
    const invLeft = Math.max(0, s.inviteDailyLimit - Sx.p.invDay.n);
    const list = scored.map(a => {
      const p = App.byId(a.id);
      return `<div class="ri"><span class="oxm ${a.ok ? 'o' : 'x'}">${a.ok ? 'O' : 'X'}</span><span><b>${U.esc(p.ti)}</b><br><span class="small muted">${U.esc(p.tp)}${a.first ? '' : ' · 이미 푼 문제'}</span></span><span class="num small">${a.ok && a.first ? '+' + POINTS : '0'}</span></div>`;
    }).join('');
    const head = set.empty
      ? `<div><div class="eyebrow">이용권</div><h2 class="title">${t > 0 ? `이용권이 ${t}개 남았습니다` : '오늘 이용권을 모두 썼습니다'}</h2><p class="muted" style="margin:6px 0 0">광고를 보거나 친구를 초대하면 3문제를 더 풀 수 있습니다.</p></div>`
      : `<div class="spread"><div><div class="eyebrow">${App.ui.set.mode === 'retry' ? '재풀이 결과' : `${scored.length}문제 결과`}</div>
          <div class="score num"><b>${okN}</b><span>/ ${scored.length} 정답</span></div></div>
          <div class="panel pad num" style="text-align:right"><div class="small muted">이번 세트</div><div style="font:800 26px/1 var(--f-display)">+${pts}점</div></div></div>
        <div class="panel pad"><div class="rlist">${list}</div></div>`;
    return `<section class="screen">
      ${head}
      <div class="reward">
        ${t > 0 ? `<button class="btn btn-ink btn-block" type="button" id="cont">남은 이용권으로 ${Math.min(3, t)}문제 더 풀기 <small class="num">남은 이용권 ${t}개</small></button>` : ''}
        <button class="btn btn-brass btn-block" type="button" id="ad" ${adLeft === 0 ? 'disabled' : ''}><span>광고 보고 3문제 더 풀기<small>끝까지 시청하면 이용권 ${s.adReward}개${adLeft != null ? ` · 오늘 남은 횟수 ${adLeft}` : ''}</small></span><span aria-hidden="true">▶</span></button>
        <button class="btn btn-line btn-block" type="button" id="share" ${invLeft === 0 ? 'disabled' : ''}><span>친구에게 공유하고 3문제 더 풀기<small>친구가 링크로 처음 접속해 첫 문제를 풀면 이용권 ${s.inviteReward}개 · 오늘 ${Sx.p.invDay.n}/${s.inviteDailyLimit}</small></span><span aria-hidden="true">↗</span></button>
      </div>
      ${!Sx.p.nick ? `<div class="panel pad spread"><span class="small">닉네임으로 로그인하면 기록이 저장되고 랭킹에 올라갑니다.</span><button class="btn btn-line" type="button" id="login">로그인</button></div>` : ''}
      <div class="row"><button class="btn btn-line" type="button" data-go="rank">랭킹 보기</button><button class="btn btn-line" type="button" data-go="notes">오답노트</button><button class="btn btn-line" type="button" data-go="home">홈</button></div>
      <p class="small muted" style="margin:0">광고를 건너뛰거나 불러오지 못하면 보상이 지급되지 않습니다. 광고 보상과 초대 보상은 따로 쌓이며 남은 이용권은 위쪽에 표시됩니다.</p>
    </section>`;
  },
  bind(el) {
    const c = U.$('#cont', el); if (c) c.onclick = () => { App.ui.set.fromResult = true; App.startSet(); };
    U.$('#ad', el).onclick = () => Ad.open();
    U.$('#share', el).onclick = () => App.go('invite');
    const l = U.$('#login', el); if (l) l.onclick = () => Login.open();
    U.$$('[data-go]', el).forEach(b => b.onclick = () => App.go(b.dataset.go));
  }
};

// ================= 랭킹 =================
function rankRows(kind) {
  const wk = Store.weekKey(), ex = new Set(Sx.flags.excluded || []);
  const rows = Object.entries(Sx.players).map(([id, r]) => ({ id, ...r }));
  const meId = Sx.uid || 'me';
  if (Sx.p.nick) {
    const mine = { id: meId, ...Store.publicRow(Sx.p) };
    const i = rows.findIndex(r => r.id === meId);
    if (i >= 0) rows[i] = mine; else rows.push(mine);
  }
  return rows.filter(r => !ex.has(r.id)).map(r => {
    const week = kind === 'week';
    const c = week ? (r.wk === wk ? r.wc : 0) : r.tc, a = week ? (r.wk === wk ? r.wa : 0) : r.ta, p = week ? (r.wk === wk ? r.wp : 0) : r.tp;
    return { id: r.id, nick: r.nick || '이름 없음', c: c || 0, a: a || 0, p: p || 0, acc: a ? c / a : 0, me: r.id === meId };
  }).filter(r => r.a > 0).sort((x, y) => y.c - x.c || y.acc - x.acc || x.a - y.a);
}
const Rank = {
  html() {
    const kind = App.ui.rankTab, rows = rankRows(kind);
    const wk = Store.weekKey(); const ws = new Date(wk + 'T00:00:00Z').getTime() - 9 * 3600e3;
    const range = `${fmtDate(ws)} ~ ${fmtDate(ws + 6 * 864e5)}`;
    let rk = 0, prev = null;
    const body = rows.map((r, i) => {
      if (!prev || prev.c !== r.c || prev.acc !== r.acc) rk = i + 1; prev = r;
      return `<tr class="${r.me ? 'me' : ''} ${rk === 1 ? 'top1' : ''}"><td class="num">${rk}</td><td>${U.esc(r.nick)}${r.me ? ' <span class="small muted">(나)</span>' : ''}</td><td class="num"><b>${r.c}</b></td><td class="num">${r.p.toLocaleString('ko-KR')}</td><td class="num">${r.a}</td><td class="num">${Math.round(r.acc * 100)}%</td></tr>`;
    }).join('');
    const empty = `<div class="empty">${kind === 'week' ? '이번 주 기록이 아직 없습니다.' : '누적 기록이 아직 없습니다.'}<br>${Sx.p.nick ? '문제를 풀면 여기에 올라갑니다.' : '닉네임으로 로그인하고 문제를 풀면 여기에 올라갑니다.'}</div>`;
    return `<section class="screen">
      <div class="spread"><div><div class="eyebrow">랭킹</div><h2 class="title">${kind === 'week' ? '이번 주 정답 수' : '전체 누적 정답 수'}</h2>
        <div class="small muted num">${kind === 'week' ? range + ' · 매주 ' + (Sx.settings.weekStart === 0 ? '일요일' : '월요일') + ' 0시(한국 시간)에 새로 시작' : '첫 풀이 기준 누적'}</div></div>
        <div class="tabs" role="tablist"><button type="button" role="tab" data-t="week" aria-selected="${kind === 'week'}">이번 주</button><button type="button" role="tab" data-t="all" aria-selected="${kind === 'all'}">전체 누적</button></div></div>
      <div class="panel pad scroll-x">${rows.length ? `<table class="rk"><thead><tr><th>순위</th><th>닉네임</th><th>정답</th><th>포인트</th><th>풀이</th><th>정답률</th></tr></thead><tbody>${body}</tbody></table>` : empty}</div>
      ${!Sx.p.nick ? `<div class="panel pad spread"><span class="small">랭킹 등록은 닉네임 로그인 후 됩니다.</span><button class="btn btn-line" type="button" id="login">로그인</button></div>` : ''}
      <p class="small muted" style="margin:0">정답 수가 같으면 정답률이 높은 순입니다. 처음 푸는 문제만 반영되고 재풀이는 반영되지 않습니다. 광고·초대로 풀이 기회가 늘어나는 참여형 랭킹이라 순수 실력 순위는 아닙니다.${Sx.remoteOk ? '' : ' 이 화면에서는 공유 저장소가 연결되지 않아 내 기록만 보입니다.'}</p>
    </section>`;
  },
  bind(el) {
    U.$$('[data-t]', el).forEach(b => b.onclick = () => { App.ui.rankTab = b.dataset.t; App.render(); });
    const l = U.$('#login', el); if (l) l.onclick = () => Login.open();
  }
};

// ================= 기록 · 오답노트 =================
const Notes = {
  html() {
    const tab = App.ui.notesTab, p = Sx.p;
    const wrong = Object.entries(p.solved).filter(([, v]) => !v.ok).sort((a, b) => b[1].at - a[1].at);
    let inner;
    if (tab === 'wrong') {
      inner = wrong.length ? `<div class="nlist">${wrong.map(([id, v]) => {
        const q = App.byId(id); if (!q) return '';
        const r = p.retry[id];
        const rs = r ? (r.ok ? '재풀이 정답' : '재풀이 오답') : '아직 다시 풀지 않음';
        return `<div class="ni"><span class="t">${U.esc(q.ti)}</span><span class="m">${LV[q.lv].nm} · ${U.esc(q.tp)} · ${fmtDate(v.at)} · ${rs}</span><button class="btn btn-line" type="button" data-retry="${U.esc(id)}">다시 풀기</button></div>`;
      }).join('')}</div>` : `<div class="empty">아직 틀린 문제가 없습니다.<br>처음 풀 때 틀린 문제가 여기에 모입니다.</div>`;
      inner = `<div class="panel pad">${inner}</div>${wrong.length > 1 ? `<button class="btn btn-ink btn-block" type="button" id="retry-all">오답 ${Math.min(3, wrong.length)}문제 이어서 다시 풀기</button>` : ''}
        <p class="small muted" style="margin:0">재풀이는 이용권을 쓰지 않으며 점수와 랭킹에 반영되지 않습니다.</p>`;
    } else {
      const lvRow = lv => { const list = App.playable(lv); const s = list.filter(q => p.solved[q.id]); const c = s.filter(q => p.solved[q.id].ok).length;
        return `<div class="ni"><span class="t">${LV[lv].nm}</span><span class="m num">${s.length ? `풀이 ${s.length} · 정답 ${c} · 정답률 ${U.pct(c, s.length)}%` : '아직 풀지 않음'}</span></div>`; };
      const store = Sx.remoteOk && Sx.uid && !Sx.readOnly ? '이 계정에 저장되어 다른 기기에서 열어도 기록과 이용권이 이어집니다.' : '이 기기의 브라우저에만 저장됩니다. 실서비스에서는 서버에 저장해 다른 기기에서도 이어집니다.';
      inner = `<div class="panel stats num"><div><b>${p.tot.a}</b><span>풀이</span></div><div><b>${p.tot.c}</b><span>정답</span></div><div><b>${U.pct(p.tot.c, p.tot.a)}%</b><span>정답률</span></div><div><b>${p.tot.p.toLocaleString('ko-KR')}</b><span>포인트</span></div></div>
        <div class="panel pad"><div class="eyebrow" style="margin-bottom:6px">이번 주</div><div class="num">정답 ${p.wk.c} · 풀이 ${p.wk.a} · 포인트 ${p.wk.p.toLocaleString('ko-KR')}</div></div>
        <div class="panel pad"><div class="eyebrow" style="margin-bottom:6px">난이도별 정답률</div><div class="nlist">${[1, 2, 3].map(lvRow).join('')}</div></div>
        <div class="panel pad" style="display:grid;gap:8px"><div class="eyebrow">계정</div>
          <div>${p.nick ? `닉네임 <b>${U.esc(p.nick)}</b>` : '게스트로 체험 중입니다.'}</div><div class="small muted">${store}</div>
          <div class="row"><button class="btn btn-line" type="button" id="login">${p.nick ? '닉네임 바꾸기' : '닉네임으로 로그인'}</button></div></div>`;
    }
    return `<section class="screen">
      <div class="spread"><div><div class="eyebrow">기록</div><h2 class="title">${tab === 'wrong' ? '오답노트' : '내 기록'}</h2></div>
      <div class="tabs" role="tablist"><button type="button" role="tab" data-t="wrong" aria-selected="${tab === 'wrong'}">오답노트</button><button type="button" role="tab" data-t="me" aria-selected="${tab === 'me'}">내 기록</button></div></div>
      ${inner}
    </section>`;
  },
  bind(el) {
    U.$$('[data-t]', el).forEach(b => b.onclick = () => { App.ui.notesTab = b.dataset.t; App.render(); });
    U.$$('[data-retry]', el).forEach(b => b.onclick = () => App.startRetry([b.dataset.retry]));
    const ra = U.$('#retry-all', el); if (ra) ra.onclick = () => {
      const ids = Object.entries(Sx.p.solved).filter(([, v]) => !v.ok).sort((a, b) => (Sx.p.retry[a[0]] ? 1 : 0) - (Sx.p.retry[b[0]] ? 1 : 0)).slice(0, 3).map(x => x[0]);
      App.startRetry(ids);
    };
    const l = U.$('#login', el); if (l) l.onclick = () => Login.open();
  }
};

// ================= 친구 초대 =================
function processInvites() {
  const p = Sx.p, s = Sx.settings; Store.roll(p);
  let n = 0;
  for (const inv of [...Sx.invites].sort((a, b) => (a.at || 0) - (b.at || 0))) {
    if (inv.id === Sx.uid || p.credited.includes(inv.id)) continue;
    if (p.invDay.n >= s.inviteDailyLimit) break;
    p.credited.push(inv.id); p.invDay.n++; p.tix.inv += s.inviteReward; p.ctr.invDone++; n++;
  }
  if (n) { Store.save(); U.toast(`친구 ${n}명이 참여했어요 · 이용권 +${n * s.inviteReward}`); App.render(); }
}
const Invite = {
  html() {
    const p = Sx.p, s = Sx.settings;
    const done = Sx.invites.filter(i => i.id !== Sx.uid).length;
    const waiting = Sx.invites.filter(i => i.id !== Sx.uid && !p.credited.includes(i.id)).length;
    const linkPart = !p.nick
      ? `<div class="panel pad" style="display:grid;gap:10px"><b>초대 링크를 만들려면 닉네임 로그인이 필요합니다.</b><span class="small muted">친구가 참여하면 누구의 초대인지 확인해 보상을 드리기 위해서입니다.</span><button class="btn btn-ink" type="button" id="login">닉네임으로 로그인</button></div>`
      : `<div class="panel pad" style="display:grid;gap:10px"><label class="eyebrow" for="inv-link">내 초대 링크</label>
          <div class="linkbox"><input id="inv-link" readonly value="${U.esc(inviteLink())}"><button class="btn btn-ink" type="button" id="copy">복사</button></div>
          <span class="small muted num">초대 코드 <b>${U.esc(p.code)}</b>${shareBase() ? '' : ' · 게시된 링크 뒤에 붙여 보내세요'}</span></div>`;
    return `<section class="screen">
      <div><div class="eyebrow">친구 초대</div><h2 class="title">친구에게 공유하고 3문제 더 풀기</h2></div>
      ${linkPart}
      <div class="panel stats num" style="grid-template-columns:repeat(3,1fr)"><div><b>${p.invDay.n}/${s.inviteDailyLimit}</b><span>오늘 받은 보상</span></div><div><b>${done}</b><span>참여 완료한 친구</span></div><div><b>${p.tix.inv}</b><span>남은 초대 이용권</span></div></div>
      ${waiting ? `<p class="small muted" style="margin:0">오늘 한도를 넘은 참여 ${waiting}건은 다음 날 자동으로 지급됩니다.</p>` : ''}
      <div class="panel pad" style="display:grid;gap:8px"><div class="eyebrow">보상 조건</div><ul class="rules">
        <li>친구가 이 링크로 처음 접속해 첫 문제를 풀면 이용권 ${s.inviteReward}개를 드립니다.</li>
        <li>공유 버튼을 누르는 것만으로는 지급되지 않습니다.</li>
        <li>하루 ${s.inviteDailyLimit}회, 최대 ${s.inviteDailyLimit * s.inviteReward}문제까지 받을 수 있습니다.</li>
        <li>같은 친구는 처음 한 번만 인정되고, 본인 초대는 제외됩니다.</li></ul></div>
      ${Sx.remoteOk ? '' : `<p class="small muted" style="margin:0">이 화면에서는 공유 저장소가 연결되지 않아 친구 참여를 확인할 수 없습니다. 게시된 링크에서 확인하세요.</p>`}
    </section>`;
  },
  bind(el) {
    const l = U.$('#login', el); if (l) l.onclick = () => Login.open();
    const c = U.$('#copy', el);
    if (c) c.onclick = () => {
      const inp = U.$('#inv-link', el), txt = inp.value;
      const ok = () => { Sx.p.ctr.linkCopies++; Store.save(); U.toast('초대 링크를 복사했어요'); };
      try { navigator.clipboard.writeText(txt).then(ok, () => { inp.select(); U.toast('링크를 선택했어요. 길게 눌러 복사하세요'); }); }
      catch (e) { inp.select(); U.toast('링크를 선택했어요. 길게 눌러 복사하세요'); }
    };
  }
};

// ================= 레이어(모달) =================
const Layer = {
  open(html, label) { const l = U.$('#layer'); l.innerHTML = `<div class="veil" role="dialog" aria-modal="true" aria-label="${U.esc(label || '')}">${html}</div>`; return l.firstElementChild; },
  close() { U.$('#layer').innerHTML = ''; }
};

const Login = {
  open() {
    const p = Sx.p;
    const where = Sx.remoteOk && Sx.uid ? '기록이 이 계정에 저장되어 다른 기기에서도 이어집니다.' : '시제품에서는 이 기기에만 저장됩니다.';
    const v = Layer.open(`<form class="modal" id="lf"><h2>간편 로그인</h2>
      <div class="field"><label for="nick">닉네임</label><input id="nick" maxlength="12" autocomplete="nickname" value="${U.esc(p.nick)}" placeholder="2~12자"><span class="hint">랭킹에 표시됩니다. 한글·영문·숫자·밑줄만 쓸 수 있어요.</span></div>
      <p class="small muted" style="margin:0">${where}</p><p class="small" id="lerr" style="margin:0;color:var(--bad)" hidden></p>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-line" type="button" id="lc">취소</button><button class="btn btn-ink" type="submit">저장</button></div></form>`, '간편 로그인');
    const inp = U.$('#nick', v); inp.focus();
    U.$('#lc', v).onclick = Layer.close;
    v.onclick = e => { if (e.target === v) Layer.close(); };
    U.$('#lf', v).onsubmit = e => {
      e.preventDefault();
      const n = inp.value.trim();
      if (!/^[\p{L}\p{N}_]{2,12}$/u.test(n)) { const er = U.$('#lerr', v); er.hidden = false; er.textContent = '닉네임은 2~12자의 한글·영문·숫자·밑줄로 입력하세요.'; return; }
      Sx.p.nick = n; Store.save(true); Layer.close(); U.toast(`${n}님, 기록 저장을 시작합니다`); App.render();
    };
  }
};

// ================= 모의 광고 =================
const Ad = {
  open() {
    const s = Sx.settings; Store.roll(Sx.p);
    if (s.adDailyLimit && Sx.p.adDay.n >= s.adDailyLimit) { U.toast('오늘 광고 보상 한도에 도달했습니다'); return; }
    Sx.p.ctr.adStart++; Store.save();
    const v = Layer.open(`<div class="adbox"><div class="adtop"><span class="adtag">모의 광고 · 실제 광고 아님 · 수익 없음</span><button class="adx" type="button" id="adx" disabled>닫기</button></div>
      <div class="adstage"><canvas id="adc" aria-hidden="true"></canvas><div class="admsg" id="admsg"><b class="num" id="adsec">${s.adSeconds}</b><span>보상형 광고 자리입니다. 실서비스에서는 광고사의 동영상이 재생되고, 시청 완료가 확인되면 이용권이 지급됩니다.</span></div></div>
      <div class="adbar"><i id="adbar"></i></div>
      <div class="adfoot" id="adfoot"><button class="btn btn-brass btn-block" type="button" id="claim" disabled>끝까지 보면 이용권 ${s.adReward}개</button></div></div>`, '모의 광고');
    const t0 = Date.now(), dur = s.adSeconds * 1000;
    let finished = false, raf = 0, iv = 0;
    const cv = U.$('#adc', v), ctx = cv.getContext('2d');
    const glyphs = ['♠', '♥', '♦', '♣'], cols = ['#e9efe9', '#ff7a6b', '#7fb0ff', '#6fd39a'];
    const parts = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), v: .0006 + Math.random() * .0014, g: Math.floor(Math.random() * 4), s: 10 + Math.random() * 18 }));
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      const w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== w) { cv.width = w; cv.height = h; }
      ctx.clearRect(0, 0, w, h);
      parts.forEach(p => { if (!still) p.y += p.v; if (p.y > 1.05) p.y = -.05; ctx.globalAlpha = .28; ctx.fillStyle = cols[p.g]; ctx.font = `${p.s}px sans-serif`; ctx.fillText(glyphs[p.g], p.x * w, p.y * h); });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const stop = () => { cancelAnimationFrame(raf); clearInterval(iv); };
    const fail = (title, body) => {
      stop();
      U.$('#admsg', v).innerHTML = `<b style="font-size:22px">${title}</b><span>${body}</span>`;
      U.$('#adfoot', v).innerHTML = `<button class="btn btn-brass btn-block" type="button" id="retry">다시 시도</button><button class="btn btn-line btn-block" type="button" id="toinv">친구 초대로 받기</button><button class="btn btn-line btn-block" type="button" id="cl">닫기</button>`;
      U.$('#adx', v).disabled = false;
      U.$('#retry', v).onclick = () => { Layer.close(); Ad.open(); };
      U.$('#toinv', v).onclick = () => { Layer.close(); App.go('invite'); };
      U.$('#cl', v).onclick = U.$('#adx', v).onclick = () => { Layer.close(); App.render(); };
    };
    if (s.adFailSim) { setTimeout(() => { Sx.p.ctr.adFail++; Store.save(); fail('광고를 불러오지 못했습니다', '보상은 지급되지 않았습니다. 잠시 후 다시 시도하거나 친구 초대로 이용권을 받을 수 있어요.'); }, 1200); return; }
    iv = setInterval(() => {
      const el = Date.now() - t0, left = Math.max(0, Math.ceil((dur - el) / 1000));
      U.$('#adbar', v).style.width = Math.min(100, el / dur * 100) + '%';
      U.$('#adsec', v).textContent = left;
      const x = U.$('#adx', v);
      if (el >= s.adSkipAfter * 1000 && x.disabled && !finished) { x.disabled = false; }
      if (el >= dur && !finished) {
        finished = true; clearInterval(iv);
        U.$('#adsec', v).textContent = '완료';
        const c = U.$('#claim', v); c.disabled = false; c.textContent = `이용권 ${s.adReward}개 받기`;
      }
    }, 200);
    U.$('#adx', v).onclick = () => {
      if (finished) { stop(); Layer.close(); return; }
      fail('광고를 끝까지 보지 않았습니다', '시청을 완료해야 보상이 지급됩니다. 다시 시도하거나 친구 초대로 받을 수 있어요.');
    };
    U.$('#claim', v).onclick = () => {
      if (!finished) return;
      stop(); Store.roll(Sx.p);
      Sx.p.tix.ad += s.adReward; Sx.p.adDay.n++; Sx.p.ctr.adDone++; Store.save(true);
      Layer.close(); U.toast(`이용권 +${s.adReward}`); App.render();
    };
  }
};

// ================= 시작 =================
function boot(data) {
  Store.initLocal();
  const m = /^#inv-([A-Za-z0-9]{4,10})$/.exec(location.hash || '');
  if (m && !Sx.p.tot.a && !Sx.p.invitedBy) { Sx.p.pendingInv = m[1].toUpperCase(); Store.save(); }
  if (data && data.ui) { try { Object.assign(App.ui, data.ui); if (App.ui.view === 'play' && !App.ui.set) App.ui.view = 'home'; } catch (e) { } }
  U.$('#go-home').onclick = () => App.go('home');
  U.$('#who-btn').onclick = () => Sx.p.nick ? App.go('notes') : Login.open();
  U.$('#ev-btn').onclick = U.$('#tix-chip').onclick = () => { if (App.ui.view === 'play') { U.toast(`남은 이용권 ${App.tickets()}개`); return; } App.ui.set = { ids: [], idx: 0, answers: [], mode: 'scored', empty: true }; App.go('result'); };
  U.$$('.nav [data-nav]').forEach(b => b.onclick = () => App.go(b.dataset.nav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && U.$('#layer').innerHTML && !U.$('#adc')) Layer.close(); });
  App.render();
  Store.on(what => {
    const v = App.ui.view;
    if (what === 'invites') { processInvites(); if (v === 'invite') App.render(); return; }
    if (what === 'progress' || what === 'readonly') { App.paintHeader(); if (v === 'home' || v === 'notes') App.render(); return; }
    if (what === 'players') { if (v === 'rank') App.render(); else if (v === 'admin') Admin.refreshLive(); return; }
    if (['settings', 'review', 'edits', 'custom', 'flags', 'who'].includes(what)) { if (v === 'admin') Admin.refreshLive(what); else if (v !== 'play') App.render(); else App.paintHeader(); }
  });
  Store.initRemote();
}
try { window.claude?.hot?.snapshot?.(() => ({ ui: JSON.parse(JSON.stringify(App.ui)) })); } catch (e) { }
if (window.claude?.hot?.ready) window.claude.hot.ready(boot); else boot(window.claude?.hot?.data ?? {});
