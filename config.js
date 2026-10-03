// Public client configuration only. Do NOT put an OpenAI key or Supabase secret key here.
// The publishable Supabase key is intentionally safe for browser use.
window.MD_CONFIG = {
  supabaseUrl: 'https://wbrvkulzojloecasdlya.supabase.co',
  publishableKey: 'sb_publishable_tmmf70bHYlGGMzaNY9-kaA_znlCZDTW',
  functionName: 'ask-mr-darkness'
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
