/* 2026-10-12 content audit. Applied on load, including after legacy admin edits.
 * Keep corrections separate from generated source so regeneration cannot undo them.
 * This is a mathematical/editorial review, not a solver certification.
 */
const ProblemReview = (() => {
  const revision = '2026-10-12';
  const range = (prefix, first, last) => Array.from({length:last-first+1}, (_,i) => prefix + String(first+i).padStart(2,'0'));
  const held = new Set([
    ...range('A',66,75), ...range('M',50,54), ...range('M',68,70),
    'B22', ...range('B',80,85), 'C03', 'A78', 'A80'
  ]);
  const finalThresholds = {A28:57.1,A93:57.1,A94:40.4,A95:61.8,A96:52.3,A97:55.5};
  const pct = n => (n * 100).toFixed(1);
  const bb = n => String(Math.round(n*100)/100);
  function apply(input, PD) {
    if (input.custom || input.contentRevision === revision) return input;
    let p = {...input, n:[...(input.n || [])]};
    let changed = false;
    const set = patch => { p = {...p,...patch}; changed = true; };
    // Keep thirteen remaining players: move the fifth off-table player to U2.
    // This preserves the original chip total instead of inventing a 100BB stack.
    if (p.tp === '버블과 ICM' && (p.pl || 8) >= 8 && p.s && typeof p.s === 'object') {
      const ctx = p.ctx || '';
      const m = ctx.match(/(다른 테이블(?: 5명)?[: ]+)([\d·]+)BB/);
      if (m && m[2].split('·').length === 5) {
        const external = m[2].split('·').map(Number);
        set({s:{...p.s,U2:external.pop()},ctx:ctx.replace(m[0], '다른 테이블 4명: '+external.join('·')+'BB')});
      }
    }
    p = PD.normalize(p);
    if (p.id === 'A26') set({ans:1, ctx:p.ctx+' 스택은 블라인드·BB 앤티 납부 전입니다. 정적 ICM으로 비교하며 이후 블라인드 이동은 모델링하지 않습니다.',
      w:'QQ는 아무 두 장을 상대로 약 80%의 에퀴티가 있습니다. BB 앤티 1BB와 블라인드 1BB를 낸 뒤 추가 콜은 33BB이고, 상대의 미매칭 금액을 반환하면 최종 팟은 69BB입니다. 정적 ICM으로 폴드의 상금 기대값은 전체 상금의 30.25%, 승리 시 35.76%, 패배 시에도 확보한 4위 상금 15%를 받습니다. 무승부를 생략한 승패 모델의 손익분기 승률은 (30.25−15)/(35.76−15) ≈ 73.5%입니다. QQ는 이 기준보다 충분히 강하므로 콜합니다. 파이널 탈락을 상금 0으로 계산하면 안 됩니다.',
      n:['이 조건에서는 QQ의 승률이 ICM 손익분기 기준을 넘으므로 폴드가 더 불리합니다.','']});
    if (p.id === 'M35') set({w:'4 세트는 상대의 A 탑페어와 많은 투페어보다 강합니다. 작은 턴 베팅에 체크레이즈로 밸류를 얻는 선택을 권장합니다. 보드는 A♠ 9♣ 4♥ 7♦로 네 가지 무늬이므로 플러시 드로우는 없습니다. T8·86·65 등 스트레이트 드로우는 가능합니다. 상대가 강한 범위로만 베팅하거나 레이즈에 많이 폴드한다면 콜도 고려할 수 있습니다.',ans:[1,2],n:['세트는 이 상황에서 폴드하기에 너무 강합니다.','','','큰 올인은 더 약한 A의 콜을 줄일 수 있습니다.']});
    if (p.id === 'A04') set({w:'K-7-2 레인보우에서 AK 탑페어 탑키커는 체크레이즈에 콜하는 것이 기본적인 대응 후보입니다. 상대는 세트·투페어와 블러프를 가질 수 있습니다. 54·64는 거트샷이 아니라 두 장이 더 필요한 백도어 스트레이트 후보입니다. 콜하면 상대의 블러프를 남기며 팟을 관리할 수 있습니다. 정확한 승률과 최적 행동은 상대의 밸류·블러프 조합 및 빈도에 따라 달라집니다.'});
    if (p.id === 'A48') set({w:p.w.replace('스트레이트(8-7)','거트샷 스트레이트 드로우(8-7, T 필요)').replace('상대 범위가 너무 강해 폴드합니다.','이 문제에서는 상대가 87 드로우로 베팅하지 않고 투페어·세트로만 리드한다고 가정해 폴드합니다.'),ctx:p.ctx+' 학습 가정: 이 크기의 턴 리드는 투페어·세트로만 하며 드로우 블러프는 없습니다.'});
    if (p.id === 'A10') set({w:p.w.replace('리버 J로 T7·QT·76 같은 스트레이트와 AJ 투페어가 생겼습니다.','리버 J로 T7·QT 스트레이트와 AJ 투페어가 생겼습니다. 76 스트레이트는 턴 8에서 이미 완성됐습니다.')});
    if (p.id === 'A11') set({w:p.w.replace('빗나간 다이아몬드·스트레이트 드로우','빗나간 스트레이트 드로우')});
    if (p.id === 'B17') set({w:p.w.replace('9 세컨드 페어','9 서드 페어')});
    if (p.id === 'B36') set({w:p.w.replace('한 칸 떨어진','두 칸 떨어진')});
    // Heads-up all-in odds use the additional live call, never subtract the ante twice.
    const num = Number(p.id.slice(1));
    if (p.id[0] === 'A' && ((num>=31 && num<=42) || (num>=76 && num<=82))) {
      const st = PD.build(p), risk = Math.min(st.toCall,st.hero.stack);
      const opponent = st.pl.find(x=>!x.folded && !x.hero);
      const uncalled = Math.max(0,opponent.bet-(st.hero.bet+risk));
      const total = st.total+risk-uncalled;
      const eqMatch = p.w.match(/승률은 약 (\d+)%/);
      const equity = eqMatch ? Number(eqMatch[1])/100 : null;
      const threshold = risk/total;
      const assumed = equity == null ? '' : ` 이 연습에서는 상대 범위에 대한 내 에퀴티를 ${pct(equity)}%로 가정합니다(솔버 검증값 아님).`;
      set({ctx:(p.ctx || '')+assumed+' ICM을 제외하고 칩 기대값만 비교합니다.',
        w:`추가 콜은 ${bb(risk/st.bb)}BB이고 콜 후 실제로 다투는 팟은 ${bb(total/st.bb)}BB입니다. 필요한 에퀴티는 ${bb(risk/st.bb)} ÷ ${bb(total/st.bb)} = ${pct(threshold)}%입니다. 앤티는 팟에 포함되지만 상대 베팅을 맞춘 금액에는 포함되지 않습니다.`+(equity==null?'':` 문제에서 가정한 에퀴티 ${pct(equity)}%와 비교하면 ${equity>threshold?'콜':'폴드'}입니다. 실제 상대 범위가 달라지면 결론도 달라질 수 있습니다.`),
        ans:equity==null?p.ans:(equity>threshold?1:0),n:['문제의 가정 에퀴티와 콜 손익분기 기준을 비교하세요.','문제의 가정 에퀴티와 콜 손익분기 기준을 비교하세요.']});
    }
    // Clear unsupported fixed answers; keep the hand for a future range/solver review.
    if ((p.tp === '버블과 ICM' && p.id !== 'A26') || held.has(p.id)) {
      let reason = p.tp === '버블과 ICM' ? '전체 스택·상금 구조와 상대의 정확한 조합·빈도를 기준으로 ICM 및 승률 재검증이 필요합니다.' :
        /^A(6[6-9]|7[0-5])$/.test(p.id) ? '카드 제거 효과, 여러 명의 콜·오버콜과 다른 선택의 기대값을 포함한 재계산이 필요합니다.' :
        /^M5[0-4]$/.test(p.id) ? '올인이 손해라는 사실만으로 폴드를 확정할 수 없습니다. 콜을 포함한 각 선택의 기대값 비교가 필요합니다.' :
        ['A78','A80'].includes(p.id) ? '수정된 팟오즈가 기존 근사 승률과 매우 가까워 정확한 상대 범위로 재계산해야 합니다.' :
        '상대의 범위와 사이즈별 대응이 정해지지 않아 특정 베팅 크기나 행동만 정답으로 확정할 수 없습니다.';
      const more = finalThresholds[p.id] ? ` 확정 상금과 BB 앤티를 반영한 정적 ICM의 승패 모델 손익분기 승률은 약 ${finalThresholds[p.id]}%입니다. 무승부와 정확한 상대 범위까지 검증한 뒤 정답을 확정합니다.` : '';
      set({reviewHold:true,reviewReason:reason,rv:'fix',ans:null,n:p.o.map(()=>''),w:'재검수 중인 문항으로 출제와 채점을 중단했습니다. '+reason+more});
      if (['A98','A99','A100'].includes(p.id)) {
        const st=PD.build(p), risk=Math.min(st.toCall,st.hero.stack), total=st.total+risk;
        p.w+=` 칩 기준 팟오즈는 ${bb(risk/st.bb)} ÷ ${bb(total/st.bb)} = ${pct(risk/total)}%입니다. ICM 기준과는 별개입니다.`;
      }
    }
    // Idempotence: repeated bank reads must not append learning assumptions again.
    if (changed) p.contentRevision = revision;
    return p;
  }
  return {apply,revision};
})();
if (typeof module !== 'undefined') module.exports = ProblemReview;
