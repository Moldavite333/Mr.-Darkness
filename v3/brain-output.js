(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const clean = (v = '') => String(v).replace(/\r/g, '').trim();

  function copyText(text, label = 'COPIED') {
    const value = clean(text);
    if (!value) return;
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).catch(fallback);
    else fallback();
    const toast = $('toast');
    if (toast) {
      toast.textContent = label;
      toast.classList.add('show');
      clearTimeout(copyText.timer);
      copyText.timer = setTimeout(() => toast.classList.remove('show'), 1800);
    }
  }

  function stripMarkdown(text) {
    return clean(text)
      .replace(/^```(?:json|text|markdown)?\s*/i, '')
      .replace(/```$/i, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^\*\*(.*?)\*\*\s*$/gm, '$1')
      .replace(/^[-*]\s+(?=(?:prompt|exclude|exclusion|notes?|diagnosis|lyrics)\b)/gim, '');
  }

  const HEADINGS = [
    { key: 'prompt', re: /^(?:music|style|suno|music\/style)\s*prompt\s*:?[ \t]*$/i },
    { key: 'exclude', re: /^(?:exclude|exclusion|negative)\s*prompt\s*:?[ \t]*$/i },
    { key: 'lyrics', re: /^lyrics?\s*:?[ \t]*$/i },
    { key: 'diagnosis', re: /^(?:diagnosis|song doctor)\s*:?[ \t]*$/i },
    { key: 'changes', re: /^(?:recommended changes?|changes?|repair brief)\s*:?[ \t]*$/i },
    { key: 'notes', re: /^(?:mr darkness notes?|notes?|why)\s*:?[ \t]*$/i }
  ];

  function headingKey(line) {
    const normalized = line.replace(/^#{1,6}\s*/, '').replace(/^\*\*(.*?)\*\*$/, '$1').trim();
    return HEADINGS.find(h => h.re.test(normalized))?.key || null;
  }

  function parseSections(raw) {
    const text = stripMarkdown(raw);
    const out = {};
    let current = null;
    let buffer = [];
    const flush = () => {
      if (current && buffer.length) out[current] = clean(buffer.join('\n'));
      buffer = [];
    };
    for (const line of text.split('\n')) {
      const key = headingKey(line);
      if (key) { flush(); current = key; continue; }
      if (current) buffer.push(line);
    }
    flush();

    // Also accept inline labels such as "STYLE PROMPT: ...".
    if (!out.prompt) {
      const m = text.match(/(?:^|\n)(?:music|style|suno)\s*prompt\s*:\s*([^\n]+(?:\n(?!\s*(?:exclude|exclusion|negative|notes?)\s*prompt?\s*:)[^\n]+)*)/i);
      if (m) out.prompt = clean(m[1]);
    }
    if (!out.exclude) {
      const m = text.match(/(?:^|\n)(?:exclude|exclusion|negative)\s*prompt\s*:\s*([\s\S]*?)(?=\n\s*(?:notes?|why)\s*:|$)/i);
      if (m) out.exclude = clean(m[1]);
    }
    return out;
  }

  function card(title, text, buttonLabel) {
    const wrap = document.createElement('section');
    wrap.className = 'brain-copy-card';
    const head = document.createElement('div');
    head.className = 'brain-copy-head';
    const label = document.createElement('strong');
    label.textContent = title;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary brain-copy-button';
    button.textContent = buttonLabel;
    button.addEventListener('click', () => copyText(text, `${title} COPIED`));
    head.append(label, button);
    const box = document.createElement('textarea');
    box.className = 'brain-copy-box';
    box.readOnly = true;
    box.value = clean(text);
    box.setAttribute('aria-label', title);
    box.addEventListener('focus', () => box.select());
    wrap.append(head, box);
    return wrap;
  }

  function renderCopyCards(message) {
    if (!message || message.dataset.copyCards === '1') return;
    const speaker = message.querySelector('span')?.textContent?.trim().toUpperCase() || '';
    if (!speaker.includes('MR DARKNESS')) return;
    const p = message.querySelector('p');
    if (!p) return;
    const raw = p.innerText || p.textContent || '';
    if (!raw.trim()) return;

    const mode = document.querySelector('#brainModes button.active')?.dataset.mode || '';
    const sections = parseSections(raw);
    const cards = document.createElement('div');
    cards.className = 'brain-copy-cards';

    if (sections.prompt) cards.append(card('MUSIC PROMPT', sections.prompt, 'COPY PROMPT'));
    if (sections.exclude) cards.append(card('EXCLUSION PROMPT', sections.exclude, 'COPY EXCLUSIONS'));
    if (sections.lyrics) cards.append(card('LYRICS', sections.lyrics, 'COPY LYRICS'));
    if (sections.diagnosis) cards.append(card('DIAGNOSIS', sections.diagnosis, 'COPY DIAGNOSIS'));
    if (sections.changes) cards.append(card('RECOMMENDED CHANGES', sections.changes, 'COPY CHANGES'));
    if (sections.notes) cards.append(card('MR DARKNESS NOTES', sections.notes, 'COPY NOTES'));

    // Suno Engineer must always have dead-simple copy targets. If the model
    // returned unstructured prose, preserve it as one clean prompt rather than
    // making the user copy rendered HTML/Markdown.
    if (!cards.children.length && mode === 'suno_engineer') {
      cards.append(card('MUSIC PROMPT', raw, 'COPY PROMPT'));
    }

    if (cards.children.length) {
      message.after(cards);
      message.dataset.copyCards = '1';
    }
  }

  function processMessages() {
    document.querySelectorAll('#brainMessages .brain-message').forEach(renderCopyCards);
  }

  function improveBrainControls() {
    const full = $('copyBrainContext');
    if (full) {
      full.textContent = 'COPY LAST ANSWER';
      full.title = 'Copies only the latest Mr Darkness answer — not the entire page or project context.';
      full.onclick = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const messages = [...document.querySelectorAll('#brainMessages .brain-message')].reverse();
        const last = messages.find(m => (m.querySelector('span')?.textContent || '').toUpperCase().includes('MR DARKNESS'));
        const text = last?.querySelector('p')?.innerText || last?.querySelector('p')?.textContent || '';
        copyText(text, 'LAST ANSWER COPIED');
      };
    }
  }

  function init() {
    improveBrainControls();
    processMessages();
    const target = $('brainMessages');
    if (target) {
      new MutationObserver(() => processMessages()).observe(target, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
