/* KitaKo — CONTROLLER · Discount: handles user actions, updates models, renders DiscountView. */
'use strict';

RENDER.discounts = el => {
  const st = S.settings;
  el.innerHTML = DiscountView.page({st});
  $('#addDisc').onclick = () => discountForm();
  el.onclick = e => {
    const ed = e.target.closest('[data-dedit]'), dl = e.target.closest('[data-ddel]');
    if (ed) discountForm(S.discounts.find(d => d.id === ed.dataset.dedit));
    if (dl) { const d = S.discounts.find(x => x.id === dl.dataset.ddel); confirmBox(`Delete discount “${d.name}”? Past receipts keep their discount details.`, () => { S.discounts = S.discounts.filter(x => x !== d); if (S.cart?.discountId === d.id) S.cart.discountId = ''; save('discounts', 'cart'); rerender(); toast('Discount deleted.', 'success'); }, {ok: 'Delete'}); }
  };
  el.onchange = e => { if (!e.target.matches('[data-den]')) return; const d = S.discounts.find(x => x.id === e.target.dataset.den); d.enabled = e.target.checked; save('discounts'); rerender(); toast(`${d.name} ${d.enabled ? 'enabled' : 'disabled'}.`, 'success'); };
};

function discountForm(d) {
  const isNew = !d; d = d || {name: '', type: 'percent', value: '', minSpend: 0, from: '', to: '', enabled: true};
  openModal(isNew ? 'Add discount' : 'Edit discount', DiscountView.discountFormModal({d}),
    DiscountView.discountFormButtons({isNew}));
  const sync = () => { const t = $('#dType').value; $('#dValLbl').textContent = t === 'fixed' ? `Amount off (${S.settings.currency})` : 'Percent off (%)'; $('#dMinWrap').hidden = t !== 'promo'; if ((t === 'senior' || t === 'pwd') && !$('#dVal').value) $('#dVal').value = S.settings.statRate; };
  $('#dType').onchange = sync; sync();
  $('#df').onsubmit = e => { e.preventDefault(); $('#dSave').click(); };
  $('#dSave').onclick = () => {
    const name = $('#dName').value.trim(), type = $('#dType').value, value = num($('#dVal').value), min = num($('#dMin').value) || 0, from = $('#dFrom').value, to = $('#dTo').value;
    if (!name) return fieldErr($('#dName'), 'Name is required.');
    if (!isFinite(value) || value <= 0) return fieldErr($('#dVal'), 'Enter a value greater than zero.');
    if (type !== 'fixed' && value > 100) return fieldErr($('#dVal'), 'A percentage cannot exceed 100%.');
    if (min < 0) return fieldErr($('#dMin'), 'Minimum spend cannot be negative.');
    if (from && to && from > to) return fieldErr($('#dTo'), '“Valid until” must be on or after “Valid from”.');
    Object.assign(d, {name, type, value: r2(value), minSpend: type === 'promo' ? r2(min) : 0, from, to, enabled: $('#dEn').checked});
    if (isNew) S.discounts.push({id: uid('d'), ...d});
    save('discounts'); closeModal(); rerender(); toast(isNew ? 'Discount added.' : 'Discount updated.', 'success');
  };
}
