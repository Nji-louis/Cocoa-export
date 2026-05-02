// Backend configuration for local Node.js server
// Replaces Supabase configuration

window.__BACKEND_CONFIG__ = {
  baseUrl: 'http://localhost:4000',
  apiPrefix: '/api',
  siteUrl: window.location.origin,
  // Mock Supabase config for compatibility
  url: 'http://localhost:4000',
  anonKey: 'local-development-key'
};