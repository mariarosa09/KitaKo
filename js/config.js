/* KitaKo — Config. Settings you fill in once per deployment. */
'use strict';

/* Google Sign-In (Google Identity Services).
   1. Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → "Web application".
   2. Under "Authorized JavaScript origins" add the address you open KitaKo from, e.g. http://localhost:5500
      (Google does not allow file:// pages — serve the folder, e.g. `python -m http.server 5500`).
   3. Paste the client ID below (it looks like 1234-abc.apps.googleusercontent.com).
   Left empty, "Continue with Google" falls back to a simulated sign-in. */
const GOOGLE_CLIENT_ID = '';
