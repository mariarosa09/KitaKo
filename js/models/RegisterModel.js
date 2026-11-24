/* KitaKo — MODEL · Cash register shift arithmetic. */
'use strict';

function shiftNumbers(s, endAt) {
  const end = endAt ? new Date(endAt) : new Date();
  const cashTx = S.txns.filter(t => t.method === 'Cash' && new Date(t.date) >= new Date(s.openedAt) && new Date(t.date) <= end);
  const cashSales = r2(sum(cashTx, t => t.total));
  const added = r2(sum(s.moves.filter(m => m.type === 'add'), m => m.amount)), withdrawn = r2(sum(s.moves.filter(m => m.type === 'withdraw'), m => m.amount)), expenses = r2(sum(s.moves.filter(m => m.type === 'expense'), m => m.amount));
  return {cashTx, cashSales, added, withdrawn, expenses, expected: r2(s.opening + cashSales + added - withdrawn - expenses)};
}
