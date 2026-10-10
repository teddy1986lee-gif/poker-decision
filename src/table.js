/* ===== 게임 테이블(SVG) 렌더러: 세로형 레이스트랙 테이블 ===== */
const TableView = (() => {
  const W = 390, H = 588;
  // 좌석(아바타 중심) — 시계 방향: 나(아래) → 왼쪽 아래 → 왼쪽 → 왼쪽 위 → 위 → 오른쪽 위 → 오른쪽 → 오른쪽 아래
  const SEAT = [[136, 486], [52, 438], [44, 330], [64, 196], [195, 104], [326, 196], [346, 330], [338, 438]];
  const SIDE = [0, 1, 1, 1, -1, -1, -1, -1];          // 상대 카드가 놓이는 방향(+1 오른쪽, -1 왼쪽)
  const PILL = [[195, 404], [112, 404], [54, 268], [154, 216], [195, 180], [236, 216], [340, 268], [278, 404]];
  const DLR = [[74, 512], [96, 460], [88, 352], [108, 218], [239, 126], [282, 218], [302, 352], [294, 460]];
  const SLOTS_BY_N = { 8: [0, 1, 2, 3, 4, 5, 6, 7], 7: [0, 1, 2, 3, 5, 6, 7], 6: [0, 1, 3, 4, 5, 7], 5: [0, 1, 3, 5, 7], 4: [0, 2, 4, 6], 3: [0, 3, 5] };
  const AV = [['#6fa0ff', '#2b4fae'], ['#ff8fb0', '#b23a62'], ['#ffc46b', '#b26a12'], ['#78e0a8', '#1f8a57'], ['#b79cff', '#5b3cc4'], ['#6fe0ee', '#1e8aa0'], ['#ff9a7a', '#b4442a'], ['#a9b8c8', '#4c5d70']];
  const VS = '︎';
  const SUIT = { s: ['♠', 'var(--s-black)'], h: ['♥', 'var(--s-red)'], d: ['♦', 'var(--s-red)'], c: ['♣', 'var(--s-black)'] };
  const RK = r => (r === 'T' ? '10' : r);
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const SYM = "font-family=\"'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols 2',sans-serif\"";
  let uidN = 0;

  function trimNum(x) { const v = Math.round(x * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); }
  function amt(chips, bb, units) { return units === 'chips' ? chips.toLocaleString('ko-KR') : trimNum(chips / bb) + 'BB'; }

  function card(code, x, y, w, h, o = {}) {
    const [glyph, col] = SUIT[code[1]];
    const rank = RK(code[0]);
    const rot = o.rot ? ` rotate(${o.rot} ${w / 2} ${h / 2})` : '';
    return `<g transform="translate(${x},${y})${rot}" role="img" aria-label="${rank}${glyph}"><g class="${o.cls || ''}">
      <rect x="1.5" y="3" width="${w}" height="${h}" rx="${w * 0.1}" fill="rgba(0,0,0,.35)"/>
      <rect width="${w}" height="${h}" rx="${w * 0.1}" fill="var(--card)" stroke="#c9ced6" stroke-width=".8"/>
      <text x="${w * 0.07}" y="${h * 0.33}" font-family="var(--f-card)" font-weight="700" font-size="${h * 0.36}" letter-spacing="${rank === '10' ? -1.5 : 0}" fill="${col}">${rank}</text>
      <text x="${w * 0.1}" y="${h * 0.54}" font-size="${h * 0.2}" fill="${col}" ${SYM}>${glyph}${VS}</text>
      <text x="${w * 0.64}" y="${h * 0.93}" text-anchor="middle" font-size="${h * 0.52}" fill="${col}" ${SYM}>${glyph}${VS}</text>
    </g></g>`;
  }
  function backs(x, y) {
    const one = (dx, rot) => `<g transform="translate(${x + dx},${y}) rotate(${rot} 8.5 12.5)"><rect width="17" height="25" rx="2.5" fill="#cfd4db" stroke="#ffffff" stroke-width="1.4"/><rect x="3" y="3" width="11" height="19" rx="1.5" fill="#aab2bc"/></g>`;
    return one(0, -6) + one(9, 6);
  }
  function chipIcon(x, y, r = 7) {
    return `<g transform="translate(${x},${y})"><circle r="${r}" fill="#e2393b" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.6 2.2"/><circle r="${r * 0.45}" fill="#b5161c" stroke="#fff" stroke-width=".8"/></g>`;
  }
  const PILLC = { cyan: ['#a6f3fb', '#3fc2db'], mint: ['#b1f7cf', '#36c985'], amber: ['#ffe596', '#f2a33a'], red: ['#ff9b8c', '#df3a2d'] };
  function pill(cx, cy, label, amount, tone, uid) {
    const w = 60, h = 26;
    const t = amount
      ? `<text x="4" y="-2.5" text-anchor="middle" font-family="var(--f-body)" font-weight="800" font-size="8.5" fill="#0b2530">${esc(label)}</text>
         <text x="4" y="9.5" text-anchor="middle" font-family="var(--f-body)" font-weight="900" font-size="12" fill="#0b2530">${esc(amount)}</text>`
      : `<text x="2" y="4.5" text-anchor="middle" font-family="var(--f-body)" font-weight="900" font-size="12.5" fill="#0b2530">${esc(label)}</text>`;
    return `<g transform="translate(${cx},${cy})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#${uid}p${tone})" stroke="rgba(0,0,0,.35)"/>${t}${chipIcon(-w / 2 + 2, -h / 2 + 3, 6.5)}</g>`;
  }
  function avatar(cx, cy, r, i, uid, hero) {
    const [a, b] = AV[i % AV.length];
    const id = `${uid}a${i}`;
    return `<g>
      <defs><radialGradient id="${id}g" cx="50%" cy="32%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient><clipPath id="${id}c"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
      ${hero ? `<circle class="pulse" cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="var(--gold)" stroke-width="3"/>` : ''}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}g)"/>
      <g clip-path="url(#${id}c)" fill="rgba(8,12,18,.42)"><circle cx="${cx}" cy="${cy - r * 0.16}" r="${r * 0.34}"/><ellipse cx="${cx}" cy="${cy + r * 0.86}" rx="${r * 0.7}" ry="${r * 0.56}"/></g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${hero ? 'url(#' + uid + 'gold)' : '#0b0f13'}" stroke-width="${hero ? 3.5 : 2.5}"/>
      ${hero ? '' : `<circle cx="${cx}" cy="${cy}" r="${r + 1.6}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1"/>`}
    </g>`;
  }

  /** 이번 스트리트에서 각 플레이어의 마지막 표시(알약) */
  function streetMarks(st) {
    const last = st.log[st.log.length - 1], m = {};
    if (st.street === 'pre') { m.SB = { t: 'sb' }; m.BB = { t: 'bb' }; }
    last.evs.forEach(e => { m[e.k] = e; });
    return m;
  }

  /** st: PD.build 결과, o: { units, label, heroName, hand } */
  function render(st, o = {}) {
    const units = o.units || 'bb', bb = st.bb, uid = 'tv' + (++uidN);
    const n = st.n, heroIdx = st.hero.i, slots = SLOTS_BY_N[n];
    const P = [];
    P.push(`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="포커 테이블: ${esc(o.label || '')}">
      <defs>
        <radialGradient id="${uid}felt" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="var(--felt)"/><stop offset=".62" stop-color="var(--felt-2)"/><stop offset="1" stop-color="var(--felt-3)"/></radialGradient>
        <linearGradient id="${uid}rail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#202327"/><stop offset=".5" stop-color="var(--rail)"/><stop offset="1" stop-color="#202327"/></linearGradient>
        <linearGradient id="${uid}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".5" stop-color="#ffd54a"/><stop offset="1" stop-color="#c77d0a"/></linearGradient>
        ${Object.entries(PILLC).map(([k, [a, b]]) => `<linearGradient id="${uid}p${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('')}
      </defs>
      <rect x="14" y="70" width="362" height="740" rx="181" fill="url(#${uid}rail)" stroke="#0c0e10" stroke-width="2"/>
      <rect x="19" y="75" width="352" height="730" rx="176" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1.5"/>
      <rect x="28" y="84" width="334" height="712" rx="167" fill="url(#${uid}felt)"/>
      <rect x="50" y="106" width="290" height="668" rx="145" fill="none" stroke="var(--felt-line)" stroke-width="1.5"/>
      <text x="195" y="320" text-anchor="middle" font-family="var(--f-game)" font-size="31" letter-spacing="1" fill="rgba(255,255,255,.075)">HOLDEM GOSU</text>
      <text x="195" y="343" text-anchor="middle" font-family="var(--f-game)" font-size="17" letter-spacing="3" fill="rgba(255,255,255,.06)">NO LIMIT</text>`);
    // 팟
    P.push(`<g transform="translate(195,254)"><rect x="-58" y="-13" width="116" height="26" rx="13" fill="rgba(5,12,14,.78)" stroke="rgba(255,255,255,.1)"/>${chipIcon(-41, 0, 8)}<text x="8" y="5" text-anchor="middle" font-family="var(--f-body)" font-weight="900" font-size="14" fill="#fff">${esc(amt(st.pot, bb, units))}</text></g>`);
    // 보드
    const cw = 42, chh = 60, gap = 4, bx0 = 195 - (5 * cw + 4 * gap) / 2;
    st.board.forEach((c, i) => P.push(card(c, bx0 + i * (cw + gap), 284, cw, chh, { cls: 'deal' })));
    P.push(`<text x="195" y="366" text-anchor="middle" font-family="var(--f-body)" font-weight="800" font-size="13.5" fill="rgba(255,255,255,.92)">${st.sb.toLocaleString('ko-KR')} / ${st.bb.toLocaleString('ko-KR')}${st.ante ? `<tspan fill="rgba(255,255,255,.6)" font-weight="600" font-size="11.5">  ·  앤티 ${st.ante.toLocaleString('ko-KR')}</tspan>` : ''}</text>`);

    const marks = streetMarks(st);
    const seatParts = [], pills = [];
    st.pl.forEach(p => {
      const rel = (p.i - heroIdx + n) % n, slot = slots[rel];
      const [x, y] = SEAT[slot], hero = p.hero, side = SIDE[slot];
      const g = [];
      // 상대 카드(뒷면)
      if (!hero && !p.folded) {
        if (slot === 2) g.push(backs(x + 12, y));
        else if (slot === 6) g.push(backs(x - 38, y));
        else g.push(backs(side > 0 ? x + 12 : x - 38, y - 18));
      }
      g.push(avatar(x, y, hero ? 31 : 25, slot, uid, hero));
      // 이름판
      if (hero) {
        g.push(`<rect x="${x - 60}" y="${y + 26}" width="120" height="36" rx="8" fill="rgba(14,18,22,.92)" stroke="rgba(255,213,74,.55)"/>
          <text x="${x}" y="${y + 40}" text-anchor="middle" font-family="var(--f-body)" font-weight="700" font-size="11" fill="#fff">${esc(o.heroName || '나')} · ${esc(PD.posName(p.k))}</text>
          <text x="${x}" y="${y + 56}" text-anchor="middle" font-family="var(--f-body)" font-weight="900" font-size="15" fill="var(--gold)">${esc(amt(p.stack, bb, units))}</text>
          <rect x="${x - 54}" y="${y + 65}" width="108" height="4" rx="2" fill="rgba(255,255,255,.12)"/><rect class="pulse" x="${x - 54}" y="${y + 65}" width="108" height="4" rx="2" fill="var(--ok)"/>`);
        if (o.hand) g.push(`<text x="${x}" y="${y + 87}" text-anchor="middle" font-family="var(--f-body)" font-style="italic" font-weight="900" font-size="13.5" fill="var(--violet)">${esc(o.hand.name)} <tspan fill="var(--ok)" font-weight="700">(${esc(o.hand.key)})</tspan></text>`);
      } else {
        g.push(`<rect x="${x - 43}" y="${y + 21}" width="86" height="30" rx="6" fill="rgba(14,18,22,.9)" stroke="rgba(255,255,255,.1)"/>
          <text x="${x}" y="${y + 33}" text-anchor="middle" font-family="var(--f-body)" font-weight="700" font-size="10.5" fill="#e9eef2">${esc(PD.posName(p.k))}${p.folded ? ' · 폴드' : ''}</text>
          <text x="${x}" y="${y + 46}" text-anchor="middle" font-family="var(--f-body)" font-weight="900" font-size="12" fill="${p.folded ? '#8a939b' : 'var(--gold)'}">${p.allin ? '올인' : esc(amt(p.stack, bb, units))}</text>`);
      }
      seatParts.push(`<g opacity="${p.folded ? 0.42 : 1}">${g.join('')}</g>`);
      // 딜러 버튼
      if (p.k === 'BTN') { const [dx, dy] = DLR[slot]; seatParts.push(`<g transform="translate(${dx},${dy})"><circle r="9.5" fill="#f5f6f7" stroke="#2a2d31" stroke-width="2"/><text y="4" text-anchor="middle" font-family="var(--f-body)" font-weight="900" font-size="11" fill="#1a1d21">D</text></g>`); }
      // 베팅 알약
      const mk = marks[p.k];
      if (!p.folded && mk) {
        const [cx, cy] = PILL[slot], A = p.bet ? amt(p.bet, bb, units) : '';
        let label, tone;
        if (mk.t === 'sb') { label = 'SB'; tone = 'cyan'; } else if (mk.t === 'bb') { label = 'BB'; tone = 'cyan'; }
        else if (p.allin || mk.allin) { label = '올인'; tone = 'red'; }
        else if (mk.t === 'x') { label = '체크'; tone = 'mint'; }
        else if (mk.t === 'c') { label = '콜'; tone = 'mint'; }
        else if (mk.t === 'b') { label = '벳'; tone = 'amber'; }
        else if (mk.t === 'r') { label = '레이즈'; tone = 'amber'; }
        if (label && (p.bet > 0 || mk.t === 'x')) pills.push(pill(cx, cy, label, A, tone, uid));
      }
    });
    P.push(seatParts.join(''), pills.join(''));
    // 내 카드(부채꼴)
    if (st.heroCards.length === 2) {
      const [hx, hy] = SEAT[0];
      P.push(card(st.heroCards[0], hx + 38, hy - 50, 50, 70, { rot: -8, cls: 'deal' }) + card(st.heroCards[1], hx + 76, hy - 54, 50, 70, { rot: 7, cls: 'deal' }));
    }
    P.push('</svg>');
    return P.join('');
  }

  function miniCards(codes) {
    return `<span class="minicards">${codes.map(c => { const [g, col] = SUIT[c[1]]; return `<span class="mc" style="color:${col}">${RK(c[0])}${g}${VS}</span>`; }).join('')}</span>`;
  }

  return { render, amt, miniCards, RK, SUIT, trimNum };
})();
