// Public client configuration only. Do NOT put an OpenAI key or Supabase secret key here.
// The publishable Supabase key is intentionally safe for browser use.
window.MD_CONFIG = {
  supabaseUrl: '',
  publishableKey: '',
  functionName: 'ask-mr-darkness'
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
