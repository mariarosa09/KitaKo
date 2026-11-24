/* KitaKo — VIEW · Receipt: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const ReceiptView = {
  showReceiptButtons({afterSale}) {
    return `<button class="btn" id="rPrint">${icon('printer')}Print</button><button class="btn" id="rPdf">${icon('download')}Download PDF</button>${afterSale ? '<button class="btn primary" data-close>New order</button>' : '<button class="btn dark" data-close>Close</button>'}`;
  },

  showReceiptModal({afterSale, t}) {
    return `${afterSale ? `<div class="note" style="margin-bottom:14px;background:var(--ok-soft);color:var(--ok)"><b>${esc(t.receipt)}</b> saved. ${t.method === 'Cash' ? 'Give change: <b>' + money(t.change) + '</b>' : 'Paid via ' + esc(t.method) + '.'}</div>` : ''}${receiptHTML(t)}`;
  },

  rcList({l}) {
    return l.length ? l.slice(0, 150).map(t => `<button class="${t.id === rcUI.sel ? 'active' : ''}" data-rc="${esc(t.id)}"><span><b class="mono">${esc(t.receipt)}</b><br><span class="hint">${fmtDT(t.date)} · ${esc(t.method)}</span></span><b class="num">${money(t.total)}</b></button>`).join('')
      : '<div class="empty"><b>No receipts found</b>Check the receipt number.</div>';
  },

  page() {
    return `<div class="rcpt-layout">
    <div class="card"><div class="card-head"><h3>Receipts</h3><span class="hint" id="rcCount"></span></div>
      <input id="rcQ" type="search" placeholder="Search receipt no. (e.g. OR-001050)" value="${esc(rcUI.q)}" style="margin-bottom:10px">
      <div class="rcpt-list" id="rcList"></div></div>
    <div><div class="row" style="margin-bottom:12px;justify-content:flex-end"><button class="btn" id="rcPrint">${icon('printer')}Print / reprint</button><button class="btn dark" id="rcPdf">${icon('download')}Download PDF</button></div><div id="rcPrev"></div></div></div>`;
  }
};
