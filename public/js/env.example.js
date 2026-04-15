// =============================================
// IUDEX — Environment Configuration (TEMPLATE)
// =============================================
// Copy this file to env.js and fill in your real values:
//
//   cp public/js/env.example.js public/js/env.js
//
// env.js is gitignored and will never be committed.
// =============================================

const ENV = {
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  },
  emailjs: {
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateUserConfirm: 'YOUR_EMAILJS_TEMPLATE_USER_CONFIRM',
    templateFounderNotify: 'YOUR_EMAILJS_TEMPLATE_FOUNDER_NOTIFY',
  },
};
