/* KitaKo — Boot: load data, then show login or the app. */
'use strict';

applyCollapse(navPref.get());

setInterval(tick, 1000);

tick();

loadGlobal();

fillIcons();

{ const u = user(); if (u && S.businesses.some(b => b.id === u.bizId)) startApp(false); else if (u && !u.bizId) showBizStep(); else { session.clear(); showAuth(); } }
