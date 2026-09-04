/* ==========================================================================
   Deployment configuration
   Set apiBase to the URL of the deployed analyser (see api/README.md) to
   turn on the one-click "enter your website" check.

   Leave it empty and the page still works: the checker falls back to the
   paste-your-source flow, which runs exactly the same page checks. The only
   thing that needs the backend is fetching your site for you and looking up
   your Google Business Profile.
   ========================================================================== */

window.DINELINE_CONFIG = {
  // e.g. 'https://dineline-site-checker.yourname.workers.dev'
  apiBase: '',

  // Where "talk to us" links point.
  siteUrl: 'https://dineline.co/',
  bookUrl: 'https://dineline.co/discovery/'
};
