/* KitaKo — VIEW · Pos: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const PosView = {
  noShift() {
    return `<div class="card shift-gate"><div class="lock-hero">${icon('register')}<h2>Open a shift to start selling</h2>
      <p class="hint">Count the cash in the drawer first. Sales are recorded against the open shift, so the drawer can be balanced when the shift closes.</p></div>
      <form class="form" id="posOpenForm">
        <label>Opening cash in the drawer (${esc(S.settings.currency)}) *<input id="posOpenAmt" type="number" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 3000"></label>
        <p class="hint">Opened by ${esc(user().fullname)} at ${fmtDT(new Date())}.</p>
        <button class="btn primary block" type="submit">Open shift and start selling</button>
      </form></div>`;
  },

  page({c}) {
    return `<div class="pos">
    <section class="pos-left">
      <div class="toolbar">
        <label class="grow">Search products<input id="posQ" type="search" placeholder="Name or SKU…" value="${esc(posUI.q)}"></label>
        <label>Sort by<select id="posSort"><option value="name">Name (A–Z)</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        <button class="btn toggle ${posUI.edit ? 'on' : ''}" id="editMenu" type="button" aria-pressed="${posUI.edit}">${icon(posUI.edit ? 'check' : 'edit')}${posUI.edit ? 'Done editing' : 'Edit menu'}</button>
      </div>
      ${posUI.edit ? '<div class="note">Editing the menu: tap a product to edit it, use the trash icon to delete it, or add a new product.</div>' : ''}
      <div class="chips" id="posCats"></div>
      <div class="products" id="posGrid"></div>
    </section>
    <aside class="ticket" id="ticket">
      <div class="ticket-head">
        <div class="row-between"><h3>Current order</h3><button class="btn sm ghost" id="heldBtn">Held orders (<span id="heldCount">${S.held.length}</span>)</button></div>
        <div class="seg" id="orderType">${['dine-in','takeout','delivery'].map(t => `<button data-ot="${t}" class="${c.orderType === t ? 'active' : ''}">${{'dine-in': 'Dine-in', takeout: 'Takeout', delivery: 'Delivery'}[t]}</button>`).join('')}</div>
        <input id="custName" placeholder="Customer name or order no. (optional)" value="${esc(c.customer)}">
      </div>
      <div class="cart" id="cart"></div>
      <div class="ticket-foot">
        <details class="more" ${c.notes || c.discountId ? 'open' : ''}><summary>Discount &amp; order notes</summary>
          <div class="form" style="gap:8px">
            <select id="discSel"><option value="">No discount</option>${S.discounts.filter(discActive).map(d => `<option value="${esc(d.id)}" ${d.id === c.discountId ? 'selected' : ''}>${esc(d.name)} — ${d.type === 'fixed' ? money(d.value) : d.value + '%'}</option>`).join('')}</select>
            <input id="idNo" placeholder="Senior/PWD ID number" value="${esc(c.idNo)}" hidden>
            <textarea id="orderNotes" placeholder="Order notes (e.g. no onions, extra gravy)">${esc(c.notes)}</textarea>
          </div></details>
        <div class="totals" id="totals"></div>
        <div class="ticket-actions">
          <button class="btn danger" id="clearCart" title="Clear cart">${icon('trash')}</button>
          <button class="btn" id="holdBtn">Hold</button>
          <button class="btn primary" id="payBtn">Charge</button>
        </div>
      </div>
    </aside>
    <button class="btn primary mobile-cart" id="mobileCart"><span>View order</span><span id="mcTotal"></span></button>
  </div>`;
  },

  products({addCard, edit, inCart, list}) {
    return list.length || edit ? addCard + list.map(p => {
    const st = stockStatus(p), off = !edit && (!p.available || st === 'out');
    const avail = !p.available ? '<span class="pill mute">Unavailable</span>' : st === 'out' ? '<span class="pill err">Out of stock</span>' : st === 'low' ? `<span class="pill warn">${p.stock} left</span>` : `<span class="pill ok">${p.stock} in stock</span>`;
    return `<button class="pcard ${off ? 'disabled' : ''} ${edit ? 'editing' : ''}" data-add="${esc(p.id)}" ${off ? 'aria-disabled="true"' : ''} ${edit ? `aria-label="Edit ${esc(p.name)}"` : ''}>${edit ? `<span class="pedit"><span title="Edit">${icon('edit')}</span><span class="del" data-pdel="${esc(p.id)}" title="Delete" role="button" aria-label="Delete ${esc(p.name)}">${icon('trash')}</span></span>` : inCart[p.id] ? `<span class="incart">${inCart[p.id]}</span>` : ''}
      <span class="pname">${esc(p.name)}</span><span class="pcat">${esc(catName(p.cat))}</span><span class="pprice">${money(p.price)}</span><span class="pstock">${avail}</span></button>`;
  }).join('') : `<div class="empty" style="grid-column:1/-1">${S.products.length ? '<b>No products found</b>Try another search or category.' : '<b>No products yet</b>' + (unlocked() ? 'Add your menu in Products.' : 'Ask the owner to add the menu.')}</div>`;
  },

  totals({c, d, lines, st, t}) {
    return `<div><span>Subtotal (${sum(lines, l => l.qty)} items)</span><span>${money(t.subtotal)}</span></div>
    ${t.lessVat ? `<div><span>Less VAT (${st.vatRate}%)</span><span>−${money(t.lessVat)}</span></div>` : ''}
    ${d ? `<div class="disc"><span>${esc(d.name)}</span><span>−${money(t.discount)}</span></div>` : ''}
    ${t.note ? `<div class="hint" style="display:block">${esc(t.note)}</div>` : ''}
    ${t.charges ? `<div><span>${c.orderType === 'delivery' ? 'Delivery fee' : 'Service charge'}</span><span>${money(t.charges)}</span></div>` : ''}
    <div><span>${st.vatInclusive ? 'VAT included' : 'VAT'} (${st.vatRate}%)</span><span>${money(t.vat)}</span></div>
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  },

  cart({lines}) {
    return lines.length ? lines.map(l => `<div class="cart-item">
      <div><div class="ci-name">${esc(l.name)}</div><div class="ci-unit">${money(l.price)} each</div></div>
      <div class="ci-sub">${money(l.price * l.qty)}</div>
      <div class="qty"><button data-q="-1" data-pid="${esc(l.pid)}" aria-label="Decrease">−</button><input data-edit="${esc(l.pid)}" type="number" min="0" inputmode="numeric" value="${l.qty}" aria-label="Quantity"><button data-q="1" data-pid="${esc(l.pid)}" aria-label="Increase">+</button></div>
      <div style="text-align:right"><button class="btn sm ghost" data-q="rm" data-pid="${esc(l.pid)}" aria-label="Remove">${icon('x')}</button></div></div>`).join('')
    : '<div class="cart-empty"><b>Cart is empty</b><br>Tap a product to add it.</div>';
  },

  heldOrdersList() {
    return S.held.length ? `<div class="list">${S.held.map(h => `<div class="list-item"><div style="flex:1"><b>${esc(h.cart.customer || 'Order ' + h.id.slice(-4).toUpperCase())}</b>
      <div class="meta">${h.cart.items.length} line(s) · ${esc(h.cart.orderType)} · held ${ago(h.at)}</div></div><b class="num">${money(h.total)}</b>
      <button class="btn sm primary" data-resume="${esc(h.id)}">Resume</button><button class="btn sm danger" data-delheld="${esc(h.id)}" aria-label="Delete">${icon('trash')}</button></div>`).join('')}</div>`
    : '<div class="empty"><b>No held orders</b>Use “Hold” to park an order while serving someone else.</div>';
  },

  referencePane({card, pay}) {
    return `<label>${card ? 'Approval / reference no.' : esc(pay.method) + ' reference no.'} *<input id="refNo" maxlength="30" autocomplete="off" inputmode="${card ? 'text' : 'numeric'}" placeholder="${pay.method === 'GCash' ? 'e.g. 1012 345 678901' : pay.method === 'Maya' ? 'e.g. 1A2B3C4D5E6F' : 'e.g. 123456'}" value="${esc(pay.ref)}"></label>
        <p class="hint">${card ? 'Copy the approval code from the card terminal slip.' : 'Check the customer’s ' + esc(pay.method) + ' receipt screen, confirm the amount, then type its reference number.'}</p><p class="form-error" id="refErr"></p>`;
  },

  cashPane({pay, qs, t}) {
    return `<label>Amount received<input id="cashIn" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" value="${esc(pay.received)}"></label>
        <div class="quick-cash">${qs.map(v => `<button class="btn sm" data-cash="${v}">${v === t.total ? 'Exact' : money(v)}</button>`).join('')}</div><div id="changeBox"></div>`;
  },

  checkoutModal({c, d, lines, t}) {
    return `<div class="pay-grid">
    <div><div class="section-title">Order summary · ${esc(c.orderType)}${c.customer ? ' · ' + esc(c.customer) : ''}</div>
      <div class="summary-items">${lines.map(l => `<div><span>${l.qty} × ${esc(l.name)}</span><span class="num">${money(l.price * l.qty)}</span></div>`).join('')}</div>
      <div class="totals" style="margin-top:10px;border-top:1px dashed var(--line);padding-top:10px">
        <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.lessVat ? `<div><span>Less VAT</span><span>−${money(t.lessVat)}</span></div>` : ''}
        <div class="disc"><span>Discount${d ? ': ' + esc(d.name) : ''}</span><span>−${money(t.discount)}</span></div>
        ${t.charges ? `<div><span>${c.orderType === 'delivery' ? 'Delivery fee' : 'Service charge'}</span><span>${money(t.charges)}</span></div>` : ''}
        <div><span>VAT (${S.settings.vatRate}%)</span><span>${money(t.vat)}</span></div>
        <div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>
      ${c.notes ? `<p class="hint" style="margin-top:8px">Note: ${esc(c.notes)}</p>` : ''}</div>
    <div class="form"><div class="section-title">Payment method</div>
      <div class="methods" id="methods">${METHODS.map(m => `<button class="method ${m === 'Cash' ? 'active' : ''}" data-m="${m}">${icon(m === 'Cash' ? 'cash' : 'register')}${m}</button>`).join('')}</div>
      <div class="due"><span>Amount due</span><b>${money(t.total)}</b></div>
      <div id="payPane"></div></div></div>`;
  }
};
