/* KitaKo — VIEW · Auth: HTML templates only. Reads data passed in by its controller (and the model for display). */
'use strict';

const AuthView = {
  verifyEmailModal({email, intro}) {
    return `<form class="form" id="otpForm" novalidate>${intro ? `<p style="margin:0">${intro}</p>` : ''}
      <p class="hint">We sent a 6-digit code to <b>${esc(email)}</b>. Enter it below.</p>
      <label>Verification code<input id="otpCode" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></label>
      <p class="form-error" id="otpErr" role="alert"></p>
      <div class="row-between"><span class="hint" id="otpTimer"></span><button type="button" class="link" id="otpResend">Resend code</button></div></form>`;
  },

  gBanner({email}) {
    return `Signing up with Google as <b>${esc(email)}</b> — Google has already verified this address. <button type="button" class="link" id="gCancel">Use a password instead</button>`;
  },

  googleFlowModal({known}) {
    return `<div class="note" style="margin-bottom:14px">Simulated Google sign-in — nothing is sent to Google. To use real Google accounts, set GOOGLE_CLIENT_ID in js/config.js and open KitaKo over http(s).</div>
    ${known.length ? `<div class="section-title">Choose an account</div>${known.map(u => `<button class="acct-row" data-gacct="${esc(u.id)}"><span class="avatar">${esc(u.fullname.slice(0, 1).toUpperCase())}</span><span style="flex:1"><b>${esc(u.fullname)}</b><br><span class="hint">${esc(u.email)}</span></span></button>`).join('')}<div class="section-title" style="margin-top:12px">Use another account</div>` : ''}
    <form class="form" id="gForm"><label>Name<input id="gName" autocomplete="name"></label><label>Google email<input id="gEmail" type="email" placeholder="you@gmail.com" autocomplete="email"></label><p class="form-error" id="gErr"></p></form>`;
  },

  forgotPasswordModal() {
    return `<form class="form" id="fpForm"><p class="hint" style="margin:0">Enter your username or email. We'll send a 6-digit code to the email on your account.</p>
    <label>Username or email<input id="fpId" autocomplete="username"></label><p class="form-error" id="fpErr"></p></form>`;
  },

  newPasswordModal({u}) {
    return `<form class="form" id="npForm"><p class="hint" style="margin:0">Email verified for <b>${esc(u.username)}</b>.</p>
    <label>New password${pwField('np1')}</label><label>Confirm new password${pwField('np2')}</label><p class="form-error" id="npErr"></p></form>`;
  }
};
