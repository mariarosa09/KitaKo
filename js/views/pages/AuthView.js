/* KitaKo — VIEW · Auth: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const AuthView = {
  verifyEmailModal({email, intro}) {
    return `<form class="form" id="otpForm" novalidate>${intro ? `<p style="margin:0">${intro}</p>` : ''}
      <p class="hint">We sent a code to <b>${esc(email)}</b>. Enter it below.</p>
      <label>Verification code<input id="otpCode" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="000000"></label>
      <p class="form-error" id="otpErr" role="alert"></p>
      <div class="row-between"><span class="hint" id="otpTimer"></span><button type="button" class="link" id="otpResend">Resend code</button></div></form>`;
  },

  gBanner({email}) {
    return `Signed in with Google as <b>${esc(email)}</b>. Choose how you'll use KitaKo and pick a username to finish. <button type="button" class="link" id="gCancel">Sign out</button>`;
  },


  forgotPasswordModal() {
    return `<form class="form" id="fpForm"><p class="hint" style="margin:0">Enter your username or email. We'll email a code to the address on your account.</p>
    <label>Username or email<input id="fpId" autocomplete="username"></label><p class="form-error" id="fpErr"></p></form>`;
  },

  newPasswordModal({email}) {
    return `<form class="form" id="npForm"><p class="hint" style="margin:0">Email verified for <b>${esc(email)}</b>.</p>
    <label>New password${pwField('np1')}</label><label>Confirm new password${pwField('np2')}</label><p class="form-error" id="npErr"></p></form>`;
  }
};
