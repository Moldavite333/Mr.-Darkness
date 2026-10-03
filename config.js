// Public client configuration only. Do NOT put an OpenAI key or Supabase secret key here.
// The publishable Supabase key is intentionally safe for browser use.
window.MD_CONFIG = {
  supabaseUrl: 'https://wbrvkulzojloecasdlya.supabase.co',
  publishableKey: 'sb_publishable_tmmf70bHYlGGMzaNY9-kaA_znlCZDTW',
  functionName: 'ask-mr-darkness'
};

const MD_SUNO_HARD_MAX = 999;
const MD_SUNO_TARGET = 900;

function mdCleanPrompt(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

function mdSplitIdeas(text = '') {
  const clean = mdCleanPrompt(text);
  if (!clean) return [];
  return clean.split(/(?<=[.!?])\s+|\s*;\s*/).map(x => x.trim()).filter(Boolean);
}

function mdPackPrompt(parts, max = MD_SUNO_TARGET) {
  const out = [];
  const seen = new Set();
  for (const part of parts) {
    for (const idea of mdSplitIdeas(part)) {
      const key = idea.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!key || seen.has(key)) continue;
      const candidate = mdCleanPrompt([...out, idea].join(' '));
      if (candidate.length <= max) {
        out.push(idea);
        seen.add(key);
      }
    }
  }
  return mdCleanPrompt(out.join(' ')).slice(0, MD_SUNO_HARD_MAX).trim();
}

function mdHardCapPrompt(text, max = MD_SUNO_HARD_MAX) {
  const clean = mdCleanPrompt(text);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const boundaries = [slice.lastIndexOf('. '), slice.lastIndexOf('; '), slice.lastIndexOf(', '), slice.lastIndexOf(' ')];
  const cut = boundaries.find(i => i >= Math.floor(max * 0.82));
  return slice.slice(0, cut > 0 ? cut + 1 : max).trim();
}

function mdReadState() {
  try { return JSON.parse(localStorage.getItem('mr-darkness-hq-v2')) || {}; }
  catch { return {}; }
}

function mdPersistSuno(style, exclude) {
  try {
    const state = mdReadState();
    state.drafts = state.drafts || {};
    state.drafts.stylePrompt = style;
    state.drafts.excludePrompt = exclude;
    localStorage.setItem('mr-darkness-hq-v2', JSON.stringify(state));
  } catch {}
}

function mdBuildCompactSuno() {
  const state = mdReadState();
  const canon = state.canon || {};
  const likes = state.memories?.likes || [];
  const dislikes = state.memories?.dislikes || [];
  const direction = document.getElementById('sunoDirection')?.value?.trim() || '';
  const tempo = document.getElementById('sunoTempo')?.value?.trim() || '';
  const energy = document.getElementById('sunoEnergy')?.value || '';
  const special = document.getElementById('sunoSpecial')?.value?.trim() || '';

  const style = mdPackPrompt([
    '1980s underground goth rock and darkwave dance; deep clear male baritone; shimmering chorus guitar, melodic bass, restrained analog synth, gated drums and plate reverb.',
    direction && `Track direction: ${direction}.`,
    special && `Specific instruction: ${special}.`,
    tempo && `Tempo: ${tempo}.`,
    energy && `Energy arc: ${energy}.`,
    canon.music,
    canon.voice,
    canon.vocalRules,
    canon.production,
    likes.length ? `Keep: ${likes.join('; ')}.` : ''
  ]);

  const exclusionIdeas = [canon.exclusions, ...dislikes.map(x => `No ${String(x).replace(/^no\s+/i, '')}.`)];
  const exclude = mdPackPrompt(exclusionIdeas);

  const styleBox = document.getElementById('stylePrompt');
  const excludeBox = document.getElementById('excludePrompt');
  if (styleBox) styleBox.value = style;
  if (excludeBox) excludeBox.value = exclude;
  mdPersistSuno(style, exclude);
  mdUpdateSunoCounters();
}

function mdUpdateSunoCounters() {
  [['stylePrompt','mdStyleCount'],['excludePrompt','mdExcludeCount']].forEach(([id, counterId]) => {
    const box = document.getElementById(id);
    const counter = document.getElementById(counterId);
    if (!box || !counter) return;
    counter.textContent = `${box.value.length}/${MD_SUNO_HARD_MAX}`;
    counter.style.opacity = box.value.length > 900 ? '1' : '.65';
  });
}

function mdClampSunoFields() {
  const styleBox = document.getElementById('stylePrompt');
  const excludeBox = document.getElementById('excludePrompt');
  if (!styleBox || !excludeBox) return;
  styleBox.value = mdHardCapPrompt(styleBox.value);
  excludeBox.value = mdHardCapPrompt(excludeBox.value);
  mdPersistSuno(styleBox.value, excludeBox.value);
  mdUpdateSunoCounters();
}

// Make the dedicated Suno AI action ask for compact outputs before the request leaves the browser.
const mdOriginalFetch = window.fetch.bind(window);
window.fetch = async function(input, init = {}) {
  try {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url.includes('/functions/v1/ask-mr-darkness') && typeof init?.body === 'string') {
      const body = JSON.parse(init.body);
      const dedicatedSunoBuild = body?.mode === 'suno_engineer' && /Build a Suno-ready response/i.test(body?.message || '');
      if (dedicatedSunoBuild) {
        body.message += '\n\nSTRICT SUNO LENGTH RULE: Return only STYLE PROMPT and EXCLUDE PROMPT. Target 850–900 characters for each section. Each section must be strictly under 1000 characters, including spaces and punctuation. Prioritize the most important musical/vocal instructions; compress wording instead of omitting the core Mr Darkness identity.';
        init = { ...init, body: JSON.stringify(body) };
      }
    }
  } catch {}
  return mdOriginalFetch(input, init);
};

// Settings connection-test hotfix: dialog elements live in the browser top layer,
// so normal toast messages can appear visually behind the open dialog on mobile.
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('testConnection');
  const label = document.getElementById('backendLabel');
  if (btn && label) {
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
  }

  const buildBtn = document.getElementById('buildSuno');
  if (buildBtn) {
    // Override the older verbose local builder with the compact version.
    buildBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      mdBuildCompactSuno();
    }, true);
  }

  [['stylePrompt','mdStyleCount'],['excludePrompt','mdExcludeCount']].forEach(([id, counterId]) => {
    const box = document.getElementById(id);
    if (!box) return;
    box.maxLength = MD_SUNO_HARD_MAX;
    const counter = document.createElement('small');
    counter.id = counterId;
    counter.style.cssText = 'float:right;margin-top:6px;font-size:10px;letter-spacing:.08em;color:#a99da0';
    box.insertAdjacentElement('afterend', counter);
    box.addEventListener('input', () => { mdClampSunoFields(); });
  });

  const aiSunoBtn = document.querySelector('[data-ai-action="suno"]');
  if (aiSunoBtn) {
    aiSunoBtn.addEventListener('click', () => {
      let ticks = 0;
      const watcher = setInterval(() => {
        ticks += 1;
        mdClampSunoFields();
        if ((!aiSunoBtn.disabled && ticks > 2) || ticks > 160) clearInterval(watcher);
      }, 150);
    }, true);
  }

  mdClampSunoFields();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
