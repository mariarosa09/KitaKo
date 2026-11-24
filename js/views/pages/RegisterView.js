/* KitaKo — VIEW · Register: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const RegisterView = {
  variance({v}) {
    return `<div class="change ${v === 0 ? 'ok' : 'bad'}" ${v > 0 ? 'style="background:var(--warn-soft);color:var(--warn)"' : ''}><span>${v === 0 ? 'Balanced' : v < 0 ? 'Cash shortage' : 'Cash overage'}</span><span>${v > 0 ? '+' : ''}${money(v)}</span></div>`;
  },

  openShiftPage({N, cur, histHTML}) {
    return `<div class="stats c5">
        <div class="stat"><span>Opening cash</span><b>${money(cur.opening)}</b></div><div class="stat"><span>Total cash sales</span><b>${money(N.cashSales)}</b></div>
        <div class="stat"><span>Cash added</span><b>${money(N.added)}</b></div><div class="stat"><span>Withdrawn + expenses</span><b>${money(N.withdrawn + N.expenses)}</b></div>
        <div class="stat hero"><span>Expected cash in drawer</span><b>${money(N.expected)}</b></div></div>
      <div class="grid-2">
        <div class="card"><h3>Record a cash movement</h3><form class="form" id="mvForm">
          <div class="grid2"><label>Type<select id="mvType"><option value="add">Cash addition</option><option value="withdraw">Cash withdrawal</option><option value="expense">Cash expense</option></select></label>
          <label>Amount *<input id="mvAmt" type="number" min="0" step="0.01" inputmode="decimal"></label></div>
          <label>Reason / description *<input id="mvReason" placeholder="e.g. Change fund top-up, bank deposit, LPG refill" maxlength="100"></label>
          <button class="btn dark" type="submit">Record movement</button></form>
          <div class="section-title" style="margin-top:16px">Movements this shift</div>
          ${cur.moves.length ? `<div class="list">${[...cur.moves].reverse().map(m => `<div class="list-item"><div style="flex:1"><b>${esc(m.reason)}</b><div class="meta">${fmtTime(m.at)} · ${{add: 'Addition', withdraw: 'Withdrawal', expense: 'Expense'}[m.type]}</div></div><b class="num" style="color:${m.type === 'add' ? 'var(--ok)' : 'var(--err)'}">${m.type === 'add' ? '+' : '−'}${money(m.amount)}</b></div>`).join('')}</div>` : '<p class="hint">No cash movements yet.</p>'}
        </div>
        <div class="card"><h3>Cash reconciliation</h3>
          <dl class="kv"><dt>Shift opened</dt><dd>${fmtDT(cur.openedAt)} · ${esc(cur.by)}</dd><dt>Opening cash</dt><dd>${money(cur.opening)}</dd><dt>Total cash sales (${N.cashTx.length})</dt><dd>+${money(N.cashSales)}</dd>
            <dt>Cash added</dt><dd>+${money(N.added)}</dd><dt>Cash withdrawn</dt><dd>−${money(N.withdrawn)}</dd><dt>Cash expenses</dt><dd>−${money(N.expenses)}</dd>
            <dt>Expected cash balance</dt><dd class="big">${money(N.expected)}</dd></dl>
          <div class="form" style="margin-top:14px"><label>Actual cash count *<input id="actual" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Count the drawer"></label>
            <div id="variance"></div>
            <div class="row"><button class="btn" id="xReport">${icon('download')}Shift report (so far)</button><span class="spacer"></span><button class="btn primary" id="closeShift">Complete reconciliation &amp; close</button></div></div></div>
      </div>${histHTML}`;
  },

  noShiftPage({histHTML}) {
    return `<div class="card"><h3>Open a new shift</h3><form class="form" id="openForm">
      <p class="hint">Count the cash in the drawer before the first sale. Cash sales are tracked from the moment the shift opens.</p>
      <label>Opening cash balance (${esc(S.settings.currency)}) *<input id="openAmt" type="number" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 3000"></label>
      <div class="note">Opening date &amp; time will be recorded as <b id="openNow">${fmtDT(new Date())}</b>.</div>
      <button class="btn primary" type="submit">Open shift</button></form></div>${histHTML}`;
  },

  history({hist}) {
    return `<div class="card"><h3>Shift history</h3>${hist.length ? `<div class="table-wrap"><table class="stack"><thead><tr><th>Opened</th><th>Closed</th><th>Cashier</th><th class="num">Opening</th><th class="num">Cash sales</th><th class="num">Expected</th><th class="num">Actual</th><th class="num">Variance</th></tr></thead><tbody>
    ${hist.map(h => `<tr class="click" data-shift="${esc(h.id)}" tabindex="0" title="View shift details"><td class="nowrap">${fmtDT(h.openedAt)}</td><td class="nowrap">${fmtDT(h.closedAt)}</td><td>${esc(h.by)}</td><td class="num">${money(h.opening)}</td><td class="num">${money(h.cashSales)}</td><td class="num">${money(h.expected)}</td><td class="num">${money(h.actual)}</td>
      <td class="num" style="color:${h.variance < 0 ? 'var(--err)' : h.variance > 0 ? 'var(--warn)' : 'var(--ok)'}"><b>${h.variance > 0 ? '+' : ''}${money(h.variance)}</b></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><b>No closed shifts yet</b></div>'}</div>`;
  },

  shiftDetailsModal({MV, N, byM, h, tx, v, vc}) {
    return `<dl class="kv">
      <dt>Cashier</dt><dd>${esc(h.by)}</dd><dt>Opened</dt><dd>${fmtDT(h.openedAt)}</dd><dt>Closed</dt><dd>${fmtDT(h.closedAt)}</dd></dl>
    <div class="section-title" style="margin-top:16px">Cash reconciliation</div>
    <dl class="kv"><dt>Opening cash</dt><dd>${money(h.opening)}</dd><dt>Cash sales (${N.cashTx.length})</dt><dd>+${money(h.cashSales)}</dd>
      <dt>Cash added</dt><dd>+${money(N.added)}</dd><dt>Cash withdrawn</dt><dd>−${money(N.withdrawn)}</dd><dt>Cash expenses</dt><dd>−${money(N.expenses)}</dd>
      <dt>Expected cash</dt><dd>${money(h.expected)}</dd><dt>Actual count</dt><dd>${money(h.actual)}</dd>
      <dt>${v === 0 ? 'Balanced' : v < 0 ? 'Shortage' : 'Overage'}</dt><dd class="big" style="color:${vc}">${v > 0 ? '+' : ''}${money(v)}</dd></dl>
    <div class="section-title" style="margin-top:16px">Sales by payment method</div>
    ${tx.length ? `<dl class="kv">${Object.entries(byM).map(([k, x]) => `<dt>${esc(k)} (${x[0]})</dt><dd>${money(x[1])}</dd>`).join('')}<dt><b>All sales (${tx.length})</b></dt><dd>${money(sum(tx, t => t.total))}</dd></dl>` : '<p class="hint">No sales during this shift.</p>'}
    <div class="section-title" style="margin-top:16px">Cash movements</div>
    ${h.moves.length ? `<div class="list">${h.moves.map(m => `<div class="list-item"><div style="flex:1"><b>${esc(m.reason)}</b><div class="meta">${fmtTime(m.at)} · ${MV[m.type]}</div></div><b class="num" style="color:${m.type === 'add' ? 'var(--ok)' : 'var(--err)'}">${m.type === 'add' ? '+' : '−'}${money(m.amount)}</b></div>`).join('')}</div>` : '<p class="hint">No cash movements.</p>'}`;
  }
};
