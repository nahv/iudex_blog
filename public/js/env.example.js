// =============================================
// IUDEX — Environment Configuration (TEMPLATE)
// =============================================
// Copy this file to env.js and fill in your real values:
//
//   cp public/js/env.example.js public/js/env.js
//
// env.js is gitignored and will never be committed.
//
// IMPORTANT: usar `window.ENV = ...` (no `const ENV = ...`) para que
// el objeto sea accesible tanto desde scripts clasicos (main.js) como
// desde ES modules (admin/js/*.js). const en script clasico no se
// expone en window y los modulos no lo ven.
// =============================================

window.ENV = {
  supabase: {
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  },
};
