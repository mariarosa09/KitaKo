/* KitaKo — CONTROLLER · Register: handles user actions, updates models, renders RegisterView. */
'use strict';

/* open the cash drawer for a new shift (used by Cash Register and by the POS gate) */
function openShift(amountInput) {
  const v = num(amountInput.value);
  if (!isFinite(v) || v < 0) return fieldErr(amountInput, 'Enter the opening cash (zero or more).');
  if (S.register.current) { toast('A shift is already open.', 'warn'); return rerender(); }
  S.register.current = {id: uid('shift'), openedAt: new Date().toISOString(), opening: r2(v), by: user().fullname, byId: user().id, moves: []};
  notify('cash', 'Shift opened', `Opening cash ${money(v)} recorded by ${user().fullname}.`, true);
  save('register', 'notifs'); updateBell(); rerender(); toast('Shift opened.', 'success');
}

const shiftOpen = () => !!S.register?.current;

// the open shift was started by the signed-in user (older shifts only stored the name)
const myOpenShift = () => { const c = S.register?.current, u = user(); return !!(c && u && (c.byId ? c.byId === u.id : c.by === u.fullname)); };

RENDER.register = el => {
  const cur = S.register.current, hist = [...S.register.history].sort((a, b) => b.closedAt.localeCompare(a.closedAt));
  const histHTML = RegisterView.history({hist});
  if (!cur) {
    el.innerHTML = RegisterView.noShiftPage({histHTML});
    $('#openForm').onsubmit = e => { e.preventDefault(); openShift($('#openAmt')); };
  } else {
    const N = shiftNumbers(cur);
    el.innerHTML = RegisterView.openShiftPage({N, cur, histHTML});
    $('#mvForm').onsubmit = e => {
      e.preventDefault(); const type = $('#mvType').value, amt = num($('#mvAmt').value), reason = $('#mvReason').value.trim();
      if (!isFinite(amt) || amt <= 0) return fieldErr($('#mvAmt'), 'Enter an amount greater than zero.');
      if (!reason) return fieldErr($('#mvReason'), 'A reason is required for every cash movement.');
      if (type !== 'add' && amt > N.expected) return fieldErr($('#mvAmt'), `The drawer should only hold ${money(N.expected)}.`);
      cur.moves.push({id: uid('m'), type, amount: r2(amt), reason, at: new Date().toISOString()});
      notify('cash', 'Cash movement recorded', `${{add: 'Addition', withdraw: 'Withdrawal', expense: 'Expense'}[type]} of ${money(amt)}: ${reason}.`, true);
      save('register', 'notifs'); updateBell(); rerender(); toast('Cash movement recorded.', 'success');
    };
    $('#actual').oninput = e => { const a = num(e.target.value); if (!isFinite(a)) { $('#variance').innerHTML = ''; return; } const v = r2(a - N.expected);
      $('#variance').innerHTML = RegisterView.variance({v}); };
    $('#xReport').onclick = () => shiftPDF({...cur, ...N, actual: num($('#actual').value), variance: isFinite(num($('#actual').value)) ? r2(num($('#actual').value) - N.expected) : null}, true);
    $('#closeShift').onclick = () => {
      const a = num($('#actual').value); if (!isFinite(a) || a < 0) return fieldErr($('#actual'), 'Enter the actual cash count to reconcile.');
      const v = r2(a - N.expected);
      confirmBox(`Close the shift with ${money(a)} counted? ${v === 0 ? 'The drawer balances.' : (v < 0 ? 'Shortage of ' : 'Overage of ') + money(Math.abs(v)) + '.'}`, () => {
        const closed = {...cur, closedAt: new Date().toISOString(), cashSales: N.cashSales, expected: N.expected, actual: r2(a), variance: v};
        S.register.history.push(closed); S.register.current = null;
        notify('cash', 'Shift closed', `Expected ${money(N.expected)}, counted ${money(a)} (${v === 0 ? 'balanced' : (v > 0 ? '+' : '') + money(v)}).`, true);
        save('register', 'notifs'); updateBell(); rerender(); toast('Shift closed and reconciled.', 'success'); shiftPDF(closed);
      }, {ok: 'Close shift', danger: false, title: 'Complete reconciliation'});
    };
  }
  const openShift = id => shiftDetails(S.register.history.find(x => x.id === id));
  el.querySelectorAll('tr[data-shift]').forEach(r => { r.onclick = () => openShift(r.dataset.shift); r.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openShift(r.dataset.shift); } }; });
};

/* shift history: details on screen; the PDF only downloads when asked */
function shiftDetails(h) {
  if (!h) return;
  const N = shiftNumbers(h, h.closedAt);
  const tx = S.txns.filter(t => new Date(t.date) >= new Date(h.openedAt) && new Date(t.date) <= new Date(h.closedAt));
  const byM = {}; tx.forEach(t => { byM[t.method] = byM[t.method] || [0, 0]; byM[t.method][0]++; byM[t.method][1] += t.total; });
  const v = h.variance, vc = v < 0 ? 'var(--err)' : v > 0 ? 'var(--warn)' : 'var(--ok)';
  const MV = {add: 'Cash addition', withdraw: 'Cash withdrawal', expense: 'Cash expense'};
  openModal('Shift · ' + fmtDate(h.openedAt), RegisterView.shiftDetailsModal({MV, N, byM, h, tx, v, vc}),
    `<button class="btn" id="shPdf">${icon('download')}Download PDF report</button><button class="btn dark" data-close>Close</button>`, {noFocus: true});
  $('#shPdf').onclick = () => shiftPDF({...h, ...N, expected: h.expected, cashSales: h.cashSales});
}
