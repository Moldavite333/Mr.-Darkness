// Public client configuration only. Do NOT put an OpenAI key or Supabase secret key here.
// The publishable Supabase key is intentionally safe for browser use.
window.MD_CONFIG = {
  supabaseUrl: 'https://wbrvkulzojloecasdlya.supabase.co',
  publishableKey: 'sb_publishable_tmmf70bHYlGGMzaNY9-kaA_znlCZDTW',
  functionName: 'ask-mr-darkness'
};

// Settings connection-test hotfix: dialog elements live in the browser top layer,
// so normal toast messages can appear visually behind the open dialog on mobile.
// Handle the TEST CONNECTION button here and report the result directly in the dialog.
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('testConnection');
  const label = document.getElementById('backendLabel');
  if (!btn || !label) return;

  btn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const token = localStorage.getItem('mr-darkness-access-token') || '';
    if (!token) {
      label.textContent = 'Save your access token first';
      return;
    }

    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = 'TESTING…';
    label.textContent = 'Connecting…';

    try {
      const cfg = window.MD_CONFIG || {};
      const url = `${String(cfg.supabaseUrl || '').replace(/\/$/, '')}/functions/v1/${cfg.functionName || 'ask-mr-darkness'}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.publishableKey || '',
          'x-md-access': token
        },
        body: JSON.stringify({ action: 'ping' })
      });

      let data = {};
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        label.textContent = data.error || `Connection failed (${res.status})`;
        return;
      }

      label.textContent = data.message || 'Mr Darkness brain is online';
      const badge = document.getElementById('connectionBadge');
      const status = document.getElementById('brainStatus');
      if (badge) { badge.textContent = 'ONLINE'; badge.classList.add('online'); }
      if (status) {
        status.classList.add('online');
        const span = status.querySelector('span');
        if (span) span.textContent = 'AI BRAIN ONLINE';
      }
    } catch (err) {
      label.textContent = `Connection problem: ${err?.message || 'unknown error'}`;
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }, true);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
