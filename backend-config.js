// Family Tree V5 backend configuration.
// The Supabase publishable/anon key is safe to use in browser code when RLS is enabled.
// NEVER place a Supabase service_role key in this repository or in browser storage.
window.FAMILY_BACKEND_CONFIG = Object.freeze({
  enabled: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  projectName: 'Family Heritage Tree'
});
