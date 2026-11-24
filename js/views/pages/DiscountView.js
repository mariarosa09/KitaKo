/* KitaKo — VIEW · Discount: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const DiscountView = {
  page({st}) {
    return `<div class="card"><div class="card-head"><h3>Discounts and promotions</h3><button class="btn primary" id="addDisc">${icon('plus')}Add discount</button></div>
    <div class="table-wrap"><table class="stack"><thead><tr><th>Name</th><th>Type</th><th class="num">Value</th><th>Min. spend</th><th>Valid</th><th>Status</th><th>Enabled</th><th></th></tr></thead><tbody>
    ${S.discounts.length ? S.discounts.map(d => { const act = discActive(d), expired = d.to && d.to < dayKey(new Date()), future = d.from && d.from > dayKey(new Date());
      return `<tr><td><b>${esc(d.name)}</b></td><td>${DISC_TYPES[d.type]}</td><td class="num">${d.type === 'fixed' ? money(d.value) : d.value + '%'}</td><td>${+d.minSpend ? money(d.minSpend) : '—'}</td>
      <td class="nowrap">${d.from || d.to ? `${d.from ? fmtDate(d.from + 'T00:00') : '…'} – ${d.to ? fmtDate(d.to + 'T00:00') : '…'}` : 'Always'}</td>
      <td>${act ? '<span class="pill ok">Active</span>' : !d.enabled ? '<span class="pill mute">Disabled</span>' : expired ? '<span class="pill err">Expired</span>' : future ? '<span class="pill y">Scheduled</span>' : '<span class="pill mute">Inactive</span>'}</td>
      <td><input type="checkbox" class="switch" data-den="${esc(d.id)}" ${d.enabled ? 'checked' : ''} aria-label="Enabled"></td>
      <td class="actions"><button class="btn sm" data-dedit="${esc(d.id)}">${icon('edit')}Edit</button><button class="btn sm danger" data-ddel="${esc(d.id)}" aria-label="Delete">${icon('trash')}</button></td></tr>`; }).join('')
      : '<tr><td colspan="8"><div class="empty"><b>No discounts yet</b>Add a promo, voucher or statutory discount.</div></td></tr>'}</tbody></table></div></div>
    <div class="card"><h3>How discounts are calculated</h3><div class="grid-2">
      <p class="hint" style="margin:0"><b>Senior Citizen &amp; PWD:</b> ${st.statVatExempt ? `the sale is VAT-exempt — the ${st.vatRate}% VAT is removed from VAT-inclusive prices first, then the discount (default ${st.statRate}%) is applied to the VAT-exclusive amount.` : 'the discount percentage is applied to the subtotal and VAT is computed normally.'} Change this in Settings.</p>
      <p class="hint" style="margin:0"><b>Percentage &amp; promotional:</b> percent off the subtotal; a promo can require a minimum spend. <b>Fixed amount:</b> peso amount off, never more than the subtotal. Breakdowns print on every receipt.</p></div></div>`;
  },

  discountFormButtons({isNew}) {
    return `<button class="btn ghost" data-close>Cancel</button><button class="btn primary" id="dSave">${isNew ? 'Add discount' : 'Save changes'}</button>`;
  },

  discountFormModal({d}) {
    return `<form class="form" id="df">
    <label>Name *<input id="dName" value="${esc(d.name)}" maxlength="50" placeholder="e.g. Weekend Promo"></label>
    <div class="grid2"><label>Type<select id="dType">${Object.entries(DISC_TYPES).map(([k, v]) => `<option value="${k}" ${k === d.type ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label><span id="dValLbl">Value</span> *<input id="dVal" type="number" min="0" step="0.01" value="${esc(d.value)}"></label></div>
    <label id="dMinWrap">Minimum spend (${esc(S.settings.currency)})<input id="dMin" type="number" min="0" step="0.01" value="${esc(d.minSpend || 0)}"></label>
    <div class="grid2"><label>Valid from<input id="dFrom" type="date" value="${esc(d.from)}"></label><label>Valid until<input id="dTo" type="date" value="${esc(d.to)}"></label></div>
    <p class="hint">Leave dates empty for a discount with no expiry.</p>
    <label class="check"><input type="checkbox" id="dEn" ${d.enabled ? 'checked' : ''}> Enabled</label></form>`;
  }
};
