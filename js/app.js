/* KitaKo — Boot: restore the Supabase session (or finish a Google sign-in), then show login or the app. */
'use strict';

applyCollapse(navPref.get());

setInterval(tick, 1000);

tick();

fillIcons();

(async () => {
  if (!sb) {
    showAuth(window.supabase ? 'KitaKo is not connected to Supabase yet. Put your project URL and publishable key in js/config.js.' : 'Could not load the Supabase library. Check your internet connection and reload.');
    $$('#authMain button, #authMain input').forEach(x => { if (!x.matches('[data-auth-tab]')) x.disabled = true; });
    return;
  }
  // a Google sign-in that failed comes back with the reason in the address
  const q = new URLSearchParams(location.search + '&' + location.hash.slice(1)), oauthErr = q.get('error_description');
  let fromGoogle = false; try { fromGoogle = sessionStorage.getItem(GP + 'oauth') === '1'; sessionStorage.removeItem(GP + 'oauth'); } catch {}
  if (oauthErr) { try { history.replaceState(null, '', location.pathname); } catch {} }
  const {data} = await sb.auth.getSession();
  if (data.session) await afterAuth(null, fromGoogle);
  else showAuth(oauthErr ? 'Google sign-in failed: ' + oauthErr : '');

  // signed out elsewhere (another tab, expired session): go back to the login screen
  sb.auth.onAuthStateChange(evt => {
    if (evt === 'SIGNED_OUT' && AUTH && !$('#app').hidden) { cloud.stop(); BIZ = null; AUTH = null; leaveApp(); closeModal(); showAuth('You were signed out.'); }
  });
})();
