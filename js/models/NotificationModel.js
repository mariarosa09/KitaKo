/* KitaKo — MODEL · Notifications (respects the per-type switches in Settings). */
'use strict';

function notify(type, title, msg, silent) {
  S.notifs = S.notifs || [];
  const prefs = S.settings && S.settings.notify;
  if (prefs && prefs[type] === false) return;   // turned off in Settings → Notifications
  S.notifs.unshift({id: uid('n'), type, title, msg, at: new Date().toISOString(), read: false});
  if (S.notifs.length > 300) S.notifs.length = 300;
  if (!silent) { save('notifs'); ModelEvents.emit('notifications:changed'); }
}
