/* KitaKo — CONTROLLER · Notification: handles user actions, updates models, renders NotificationView. */
'use strict';

const ntUI = {f: 'all'};

RENDER.notifications = el => {
  const list = S.notifs.filter(n => ntUI.f === 'all' || (ntUI.f === 'unread' ? !n.read : ntUI.f === 'stock' ? n.type === 'low' || n.type === 'out' : n.type === ntUI.f));
  el.innerHTML = NotificationView.page({list});
  el.onclick = e => {
    const f = e.target.closest('[data-nf]'), r = e.target.closest('[data-nread]'), d = e.target.closest('[data-ndel]');
    if (f) { ntUI.f = f.dataset.nf; rerender(); }
    if (r) { S.notifs.find(n => n.id === r.dataset.nread).read = true; save('notifs'); updateBell(); rerender(); }
    if (d) { S.notifs = S.notifs.filter(n => n.id !== d.dataset.ndel); save('notifs'); updateBell(); rerender(); }
    if (e.target.closest('#ntRead')) { S.notifs.forEach(n => n.read = true); save('notifs'); updateBell(); rerender(); }
    if (e.target.closest('#ntClear')) confirmBox('Clear all notifications?', () => { S.notifs = []; save('notifs'); updateBell(); rerender(); }, {ok: 'Clear all'});
  };
};
