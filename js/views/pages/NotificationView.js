/* KitaKo — VIEW · Notification: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const NotificationView = {
  page({list}) {
    return `<div class="card"><div class="card-head"><div class="chips" id="ntF">${[['all', 'All'], ['unread', 'Unread'], ['stock', 'Stock alerts'], ['sale', 'Sales'], ['inventory', 'Inventory'], ['product', 'Products'], ['cash', 'Cash register'], ['summary', 'Summaries']].map(([k, l]) => `<button class="chip ${ntUI.f === k ? 'active' : ''}" data-nf="${k}">${l}</button>`).join('')}</div>
    <div class="row"><button class="btn sm" id="ntRead">Mark all read</button><button class="btn sm danger" id="ntClear">Clear all</button></div></div>
    ${list.length ? `<div>${list.slice(0, 200).map(n => { const t = NT[n.type] || NT.info; return `<div class="notif ${n.read ? '' : 'unread'}"><span class="n-ico ${t[1]}" aria-hidden="true">${icon(t[2])}</span>
      <div style="flex:1"><div class="n-title">${esc(n.title)}</div><div class="n-msg">${esc(n.msg)}</div><div class="n-time">${t[0]} · ${ago(n.at)}</div></div>
      <div class="actions">${n.read ? '' : `<button class="btn sm" data-nread="${esc(n.id)}">Mark read</button>`}<button class="icon-btn sm" data-ndel="${esc(n.id)}" aria-label="Dismiss">${icon('x')}</button></div></div>`; }).join('')}</div>`
      : '<div class="empty"><b>You’re all caught up</b>No notifications in this view.</div>'}</div>`;
  }
};
