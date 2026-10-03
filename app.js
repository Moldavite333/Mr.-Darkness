(() => {
  'use strict';

  const STORE_KEY = 'mr-darkness-hq-v2';
  const ACCESS_KEY = 'mr-darkness-access-token';
  const cfg = window.MD_CONFIG || {};

  const DEFAULT_CANON = {
    identity: 'Mr Darkness is a mysterious recurring 1980s goth frontman: tall, lean, controlled, magnetic, half-observed rather than explained. He is a real artist-character, not a parody, Halloween mascot, fantasy villain, or generic goth archetype.',
    world: 'The core world feels like 1985–1987: underground clubs, red bulbs, smoke, concrete corridors, wet alleys, analog equipment, VHS-era darkness and late-night city isolation. Modern polish should never break the illusion.',
    voice: 'Deep male baritone. Cold, intelligible, restrained, intimate and unmistakably 1980s goth/darkwave. The register stays low without becoming muddy or comically bass-heavy.',
    vocalRules: 'Mostly chest voice and narrow melodic movement. Controlled phrasing, clear consonants, minimal runs, no glossy stacking, no modern vocal effects. Emotion comes from restraint, repetition and phrasing rather than belting.',
    music: 'Approximately 95% 1980s goth rock / darkwave dance music, with small psychedelic and progressive arranging ideas. Shimmering chorus guitar, melodic bass, analog synth atmosphere, drum-machine or gated acoustic character, nocturnal dance-floor pulse. Guitar and bass remain central; synth supports rather than hijacks.',
    production: 'Analog-minded, tactile and slightly imperfect. Chorus guitar, plate reverb, gated snare, warm bass, restrained arpeggiation, evolving sections and long instrumental passages when useful. Tracks can begin minimal and accumulate layers into a large dance-floor crescendo.',
    lyrics: 'Dark, human, concrete and psychologically suggestive. Favor unusual turns of phrase, repetition, simple images with double meanings, alienation, internal spaces, nighttime movement and half-explained observations. Write lines a person could actually sing and remember.',
    lyricAvoid: 'Avoid piles of goth buzzwords, empty abstract noun chains, melodramatic fantasy language, generic romance, diary-style emo confession, forced rhyme, overwritten poetry and stock AI phrases. Darkness should come from the idea, not from repeatedly saying shadow, blood, moon, grave, raven, void or darkness.',
    visual: 'Tall slim silhouette, black overcoat or trench coat, dark tousled hair, pale partially shadowed face, deep-set eyes, controlled body language. Moody, charismatic, slightly uncanny but recognizably human.',
    visualLanguage: 'Cinematic 1980s underground darkwave photography: smoke, dim practical bulbs, dirty red light, deep black negative space, grain, imperfect analog exposure, concrete, wet pavement, VHS texture and sparse compositions. Romantic and eerie without looking like modern cosplay.',
    exclusions: 'No falsetto. No head voice. No tenor-led vocal. No high chorus vocal. No screaming or screamo. No pop vocal phrasing. No emo vocal tone. No vocoder. No Auto-Tune effect. No robotic vocal processing. No glossy vocal stacks. No bright synthwave. No EDM drops. No modern pop drums. No trap hats. No djent. No metalcore. No heavy-guitar takeover. No shred guitar. No glam tapping. No arena-rock belting. No cheerful major-key uplift. No hyper-clean digital production.'
  };

  const MODES = {
    creative_director: {
      label: 'Creative Director',
      description: 'Protects the whole Mr Darkness identity and helps decide what belongs, what drifts, and what to try next.',
      starters: ['What is this idea missing?', 'Does this still sound like Mr Darkness?', 'Help me narrow this concept.', 'Give me three directions without breaking canon.']
    },
    song_doctor: {
      label: 'Song Doctor',
      description: 'Diagnoses why a track is working or drifting, then prescribes specific musical and prompt changes.',
      starters: ['The chorus suddenly sounds modern.', 'The vocal is right but the music is wrong.', 'The synth keeps taking over.', 'How do I make the build hit harder?']
    },
    lyric_writer: {
      label: 'Lyric Writer',
      description: 'Writes and edits singable Mr Darkness lyrics while protecting meter, memorable phrasing and the no-cliché rule.',
      starters: ['This line fits the meter but I hate the wording.', 'Build a chorus around this phrase.', 'Make this darker without goth buzzwords.', 'Keep my first two lines and finish the verse.']
    },
    suno_engineer: {
      label: 'Suno Engineer',
      description: 'Translates what you hear in your head into precise Suno style directions and aggressive exclusion prompts.',
      starters: ['Turn this into a Suno prompt.', 'My last generation went too heavy.', 'Lock the vocal to deep 80s baritone.', 'Give me positive and exclusion prompts.']
    },
    producer: {
      label: 'Producer',
      description: 'Thinks in arrangement, dynamics, instrumentation, transitions, mix perspective and album continuity.',
      starters: ['Map the arrangement for this track.', 'Where should the instrumental section go?', 'Make the crescendo feel earned.', 'How do these two songs belong on one EP?']
    },
    visual_director: {
      label: 'Visual Director',
      description: 'Maintains one recognizable Mr Darkness character and translates the mythology into covers, scenes and video sequences.',
      starters: ['Make this scene feel less AI-generated.', 'Plan five shots for this chorus.', 'Keep the same character but change the location.', 'Design an EP cover direction.']
    },
    marketing_director: {
      label: 'Marketing Director',
      description: 'Builds mysterious, coherent release campaigns without turning Mr Darkness into corny branded content.',
      starters: ['Tease the EP without explaining too much.', 'Give me a 15-second Reel concept.', 'What should I post before the first single?', 'Turn this image into a launch post.']
    }
  };

  const baseState = () => ({
    version: 2,
    canon: { ...DEFAULT_CANON },
    memories: {
      likes: [
        'Shimmering 1980s chorus guitar as a core texture',
        'Deep intelligible goth baritone with restrained delivery',
        'Songs that begin minimal and build into a large dance-floor crescendo',
        'Melodic bass that helps carry the hook',
        'Small psychedelic / prog arrangement surprises without leaving goth rock'
      ],
      dislikes: [
        'Modern vocoder or robotic vocal processing',
        'Whiny emo or high male vocals',
        'Heavy guitar becoming the main identity',
        'Bright modern synth arpeggios dominating the track',
        'Generic goth buzzword lyrics stitched together without meaning'
      ]
    },
    chat: [],
    activeMode: 'creative_director',
    songs: [],
    activeSongId: null,
    drafts: { lyrics: '', stylePrompt: '', excludePrompt: '', visualPrompt: '', campaignOut: '' }
  });

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!raw) return baseState();
      const fresh = baseState();
      return {
        ...fresh,
        ...raw,
        canon: { ...fresh.canon, ...(raw.canon || {}) },
        memories: { ...fresh.memories, ...(raw.memories || {}) },
        drafts: { ...fresh.drafts, ...(raw.drafts || {}) }
      };
    } catch { return baseState(); }
  }

  let state = loadState();
  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  function saveState(message = 'SAVED LOCALLY') {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if ($('saveState')) $('saveState').textContent = message;
    window.setTimeout(() => { if ($('saveState')) $('saveState').textContent = 'SAVED LOCALLY'; }, 1100);
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => el.classList.remove('show'), 2300);
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
  }

  function navigate(view) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === view));
    $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $('sidebar').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'vault') renderVault();
  }

  function currentSong() {
    return state.songs.find(s => s.id === state.activeSongId) || null;
  }

  function buildContextObject() {
    const song = currentSong();
    return {
      canon: state.canon,
      likes: state.memories.likes,
      dislikes: state.memories.dislikes,
      activeSong: song ? {
        title: song.title,
        status: song.status,
        energy: song.energy,
        notes: song.notes,
        lyrics: song.lyrics || ''
      } : null
    };
  }

  function buildContextText() {
    const c = buildContextObject();
    return [
      'MR DARKNESS — MASTER CONTEXT',
      '',
      'IDENTITY\n' + c.canon.identity,
      '\nWORLD / ERA\n' + c.canon.world,
      '\nVOICE\n' + c.canon.voice,
      '\nVOCAL RULES\n' + c.canon.vocalRules,
      '\nMUSIC\n' + c.canon.music,
      '\nPRODUCTION\n' + c.canon.production,
      '\nLYRICS\n' + c.canon.lyrics,
      '\nLYRIC AVOIDS\n' + c.canon.lyricAvoid,
      '\nVISUAL\n' + c.canon.visual,
      '\nVISUAL LANGUAGE\n' + c.canon.visualLanguage,
      '\nHARD EXCLUSIONS\n' + c.canon.exclusions,
      '\nLEARNED LIKES\n- ' + (c.likes.join('\n- ') || 'None yet'),
      '\nLEARNED DON\'TS\n- ' + (c.dislikes.join('\n- ') || 'None yet'),
      c.activeSong ? '\nACTIVE SONG\n' + JSON.stringify(c.activeSong, null, 2) : '\nACTIVE SONG\nNone selected.'
    ].join('\n');
  }

  function renderHome() {
    const dna = ['1986 darkwave','deep baritone','shimmer guitar','melodic bass','analog synth','dance-floor pulse','plate reverb','gated snare','slow builds','psychedelic detail'];
    $('dna').innerHTML = dna.map(x => `<span class="chip">${escapeHtml(x)}</span>`).join('');
    const danger = ['modern pop / emo vocal','vocoder / robotic voice','bright synthwave takeover','heavy guitar takeover','generic goth cliché writing'];
    $('danger').innerHTML = danger.map(x => `<li>${escapeHtml(x)}</li>`).join('');
    $('likeCount').textContent = state.memories.likes.length;
    $('dislikeCount').textContent = state.memories.dislikes.length;
    $('songCount').textContent = state.songs.length;
    const song = currentSong();
    $('activeTitle').textContent = song?.title || 'Untitled Transmission';
    $('activeSongStatus').textContent = (song?.status || 'Idea').toUpperCase();
    $('songTitle').value = song?.title || '';
    $('songStatus').value = song?.status || 'Idea';
    $('songEnergy').value = song?.energy || 'Dance floor';
    $('songNotes').value = song?.notes || '';
  }

  function renderCanon() {
    $$('[data-canon]').forEach(el => el.value = state.canon[el.dataset.canon] || '');
  }

  function renderMemories() {
    const make = (items, type) => items.length ? items.map((item, i) => `<div class="memory-item ${type}"><span>${escapeHtml(item)}</span><button data-memory="${type}" data-index="${i}" aria-label="Remove">×</button></div>`).join('') : '<span class="empty">Nothing learned yet.</span>';
    $('likes').innerHTML = make(state.memories.likes, 'like');
    $('dislikes').innerHTML = make(state.memories.dislikes, 'dislike');
    $('likeCount').textContent = state.memories.likes.length;
    $('dislikeCount').textContent = state.memories.dislikes.length;
    const contextSize = buildContextText().length;
    const percent = Math.min(100, Math.max(18, Math.round(contextSize / 90)));
    $('contextMeter').style.width = `${percent}%`;
    $('contextLabel').textContent = `${Math.round(contextSize / 100) / 10}k chars • canon + taste + active song`;
  }

  function addMemory(type, text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    const list = type === 'like' ? state.memories.likes : state.memories.dislikes;
    if (!list.some(x => x.toLowerCase() === clean.toLowerCase())) list.unshift(clean);
    saveState('MEMORY UPDATED');
    renderMemories();
    renderHome();
    toast(type === 'like' ? 'Remembered as a LIKE.' : 'Added to the DON’T list.');
  }

  function renderMode() {
    const mode = MODES[state.activeMode] || MODES.creative_director;
    $('modeTitle').textContent = mode.label;
    $('modeDescription').textContent = mode.description;
    $$('.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === state.activeMode));
    $('starters').innerHTML = mode.starters.map(s => `<button data-starter="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('');
  }

  function renderChat() {
    if (!state.chat.length) {
      $('messages').innerHTML = '<div class="msg md"><span class="meta">MR DARKNESS // CREATIVE SYSTEM</span><strong>Tell me what you are trying to make.</strong> Correct me aggressively. Save what works as a LIKE and what fails as a DON’T. Once the AI backend is connected, every reply will receive the canon, your learned taste and the active song.</div>';
      return;
    }
    $('messages').innerHTML = state.chat.map(m => `<div class="msg ${m.role === 'user' ? 'user' : 'md'}"><span class="meta">${m.role === 'user' ? 'YOU' : 'MR DARKNESS'} // ${escapeHtml(MODES[m.mode]?.label || MODES.creative_director.label)}</span>${escapeHtml(m.text)}</div>`).join('');
    $('messages').scrollTop = $('messages').scrollHeight;
  }

  function isBackendConfigured() {
    return Boolean(cfg.supabaseUrl && cfg.publishableKey && cfg.functionName);
  }

  function accessToken() { return localStorage.getItem(ACCESS_KEY) || ''; }

  function setConnection(online, label) {
    $('brainStatus').classList.toggle('online', online);
    $('brainStatus').querySelector('span').textContent = label || (online ? 'AI BRAIN ONLINE' : 'LOCAL BRAIN');
    $('connectionBadge').classList.toggle('online', online);
    $('connectionBadge').textContent = online ? 'ONLINE' : 'OFFLINE';
  }

  async function callBrain(payload) {
    if (!isBackendConfigured()) throw new Error('The Mr Darkness backend is not configured yet.');
    if (!accessToken()) throw new Error('Add your private access token in Settings first.');
    const url = `${cfg.supabaseUrl.replace(/\/$/, '')}/functions/v1/${cfg.functionName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.publishableKey,
        'x-md-access': accessToken()
      },
      body: JSON.stringify(payload)
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data.error || `Backend returned ${res.status}`);
    return data;
  }

  function offlineResponse(text) {
    const mode = MODES[state.activeMode];
    return `I saved that in the ${mode.label} conversation, but the remote AI brain is not connected yet. The useful parts of HQ still work locally: canon, likes/don'ts, song context, writing briefs and prompt builders.\n\nIf “${text.slice(0, 120)}${text.length > 120 ? '…' : ''}” describes something you want permanently reinforced or banned, use the LIKE / DON'T buttons below so it becomes part of the master context.`;
  }

  async function sendChat() {
    const input = $('askInput');
    const text = input.value.trim();
    if (!text) return;
    state.chat.push({ role: 'user', text, mode: state.activeMode, at: Date.now() });
    input.value = '';
    saveState();
    renderChat();
    $('askSend').disabled = true;
    $('askSend').textContent = 'THINKING…';
    try {
      let answer;
      if (isBackendConfigured() && accessToken()) {
        const result = await callBrain({
          action: 'chat',
          mode: state.activeMode,
          message: text,
          history: state.chat.slice(-14),
          context: buildContextObject()
        });
        answer = result.answer || 'No answer returned.';
        setConnection(true);
      } else {
        answer = offlineResponse(text);
        setConnection(false);
      }
      state.chat.push({ role: 'assistant', text: answer, mode: state.activeMode, at: Date.now() });
      saveState();
      renderChat();
    } catch (err) {
      state.chat.push({ role: 'assistant', text: `Connection problem: ${err.message}`, mode: state.activeMode, at: Date.now() });
      setConnection(false);
      saveState();
      renderChat();
    } finally {
      $('askSend').disabled = false;
      $('askSend').textContent = 'ASK';
    }
  }

  function localSunoBuild() {
    const direction = $('sunoDirection').value.trim();
    const tempo = $('sunoTempo').value.trim();
    const energy = $('sunoEnergy').value;
    const special = $('sunoSpecial').value.trim();
    const positive = [
      '1980s underground goth rock and darkwave dance track.',
      state.canon.music,
      state.canon.voice,
      state.canon.vocalRules,
      state.canon.production,
      direction && `Track direction: ${direction}`,
      tempo && `Tempo: ${tempo}.`,
      `Energy arc: ${energy}.`,
      special && `Specific instruction: ${special}`,
      state.memories.likes.length && `Preserve these learned preferences: ${state.memories.likes.join('; ')}.`
    ].filter(Boolean).join(' ');
    const negatives = [state.canon.exclusions, ...state.memories.dislikes.map(x => `No ${x.replace(/^no\s+/i,'')}.`)].join(' ');
    $('stylePrompt').value = positive;
    $('excludePrompt').value = negatives;
    state.drafts.stylePrompt = positive;
    state.drafts.excludePrompt = negatives;
    saveState();
    toast('Suno prompts rebuilt from canon.');
  }

  function localVisualBuild() {
    const format = $('visualFormat').value;
    const scene = $('visualScene').value.trim();
    const aspect = $('visualAspect').value.trim();
    const out = `${format}. ${state.canon.visual} ${state.canon.visualLanguage}${scene ? ` Scene: ${scene}` : ''}${aspect ? ` Composition: ${aspect}.` : ''} Maintain one consistent recognizable Mr Darkness character. Avoid glossy digital fantasy art, cosplay styling, plastic skin, exaggerated vampire makeup, text artifacts and generic AI poster composition.`;
    $('visualPrompt').value = out;
    state.drafts.visualPrompt = out;
    saveState();
  }

  function localCampaignBuild() {
    const name = $('campaignName').value.trim() || 'Untitled Mr Darkness release';
    const goal = $('campaignGoal').value;
    const platform = $('campaignPlatform').value;
    const idea = $('campaignIdea').value.trim();
    const out = `CAMPAIGN: ${name}\nGOAL: ${goal}\nPLATFORM: ${platform}\n\nCORE RULE\nMarket Mr Darkness as a discovered recurring artist-character, not as an AI gimmick. Preserve mystery. Show fragments of the world before explaining it.\n\nRAW IDEA\n${idea || 'No raw idea supplied yet.'}\n\nCONTENT ARC\n1. Signal — one striking image or 10–15 second audio fragment with almost no explanation.\n2. Evidence — another visual from the same world plus a lyric fragment.\n3. Identity — reveal the release title / artwork.\n4. Transmission — strongest chorus or visual moment shortly before release.\n5. Release — direct link and clean artwork; keep copy short.\n6. Afterimage — alternate scene, lyric or behind-the-song artifact to keep the world alive.\n\nTONE\nMinimal, nocturnal, slightly strange, confident. Never beg for engagement and never over-explain the character.`;
    $('campaignOut').value = out;
    state.drafts.campaignOut = out;
    saveState();
  }

  function buildLyricBrief() {
    const concept = $('lyricConcept').value.trim();
    const anchor = $('anchorLine').value.trim();
    const target = $('lyricTarget').value;
    const motion = $('lyricMotion').value;
    const notes = $('lyricNotes').value.trim();
    $('lyricBriefOut').textContent = `TARGET: ${target}\nMOTION: ${motion}\nCONCEPT: ${concept || 'open'}\nANCHOR: ${anchor || 'none'}\n\nMR DARKNESS WRITING RULES:\n${state.canon.lyrics}\n\nAVOID:\n${state.canon.lyricAvoid}\n${notes ? `\nSONG-SPECIFIC NOTES:\n${notes}` : ''}`;
  }

  async function runAIAction(action) {
    const map = {
      lyrics: {
        mode: 'lyric_writer',
        message: () => `Work on Mr Darkness lyrics. Target: ${$('lyricTarget').value}. Motion: ${$('lyricMotion').value}. Concept: ${$('lyricConcept').value}. Anchor line: ${$('anchorLine').value}. Notes: ${$('lyricNotes').value}. Current draft:\n${$('lyricsDraft').value}`,
        target: 'lyricsDraft'
      },
      suno: {
        mode: 'suno_engineer',
        message: () => `Build a Suno-ready response with two clearly labeled sections STYLE PROMPT and EXCLUDE PROMPT. Direction: ${$('sunoDirection').value}. Tempo: ${$('sunoTempo').value}. Energy: ${$('sunoEnergy').value}. Special instruction: ${$('sunoSpecial').value}.`,
        target: null
      },
      visual: {
        mode: 'visual_director',
        message: () => `Build a concise image-generation visual brief. Format: ${$('visualFormat').value}. Scene: ${$('visualScene').value}. Framing/aspect: ${$('visualAspect').value}.`,
        target: 'visualPrompt'
      },
      marketing: {
        mode: 'marketing_director',
        message: () => `Build a practical release campaign board. Release: ${$('campaignName').value}. Goal: ${$('campaignGoal').value}. Platform: ${$('campaignPlatform').value}. Raw thought: ${$('campaignIdea').value}.`,
        target: 'campaignOut'
      }
    };
    const job = map[action];
    if (!job) return;
    if (!isBackendConfigured() || !accessToken()) {
      toast('AI brain not connected yet — using local tools where available.');
      if (action === 'suno') localSunoBuild();
      if (action === 'visual') localVisualBuild();
      if (action === 'marketing') localCampaignBuild();
      if (action === 'lyrics') buildLyricBrief();
      return;
    }
    const button = document.querySelector(`[data-ai-action="${action}"]`);
    const old = button.textContent;
    button.disabled = true;
    button.textContent = 'THINKING…';
    try {
      const result = await callBrain({ action: 'chat', mode: job.mode, message: job.message(), history: [], context: buildContextObject() });
      const answer = result.answer || '';
      if (action === 'suno') {
        const split = answer.split(/EXCLUDE PROMPT:?/i);
        $('stylePrompt').value = split[0].replace(/STYLE PROMPT:?/i,'').trim();
        $('excludePrompt').value = (split[1] || '').trim();
        state.drafts.stylePrompt = $('stylePrompt').value;
        state.drafts.excludePrompt = $('excludePrompt').value;
      } else if (job.target) {
        $(job.target).value = answer;
        state.drafts[job.target === 'lyricsDraft' ? 'lyrics' : job.target] = answer;
      }
      saveState();
      setConnection(true);
    } catch (err) { toast(err.message); setConnection(false); }
    finally { button.disabled = false; button.textContent = old; }
  }

  function saveSong() {
    const title = $('songTitle').value.trim() || 'Untitled Transmission';
    let song = currentSong();
    if (!song) {
      song = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), createdAt: Date.now() };
      state.songs.unshift(song);
      state.activeSongId = song.id;
    }
    Object.assign(song, {
      title,
      status: $('songStatus').value,
      energy: $('songEnergy').value,
      notes: $('songNotes').value.trim(),
      lyrics: $('lyricsDraft').value || song.lyrics || '',
      stylePrompt: $('stylePrompt').value || song.stylePrompt || '',
      excludePrompt: $('excludePrompt').value || song.excludePrompt || '',
      updatedAt: Date.now()
    });
    saveState('SONG SAVED');
    renderHome();
    renderVault();
    toast(`${title} saved.`);
  }

  function renderVault() {
    $('songCount').textContent = state.songs.length;
    if (!state.songs.length) {
      $('vaultGrid').innerHTML = '<div class="panel empty">No songs saved yet. Start one in the Control Room.</div>';
      return;
    }
    $('vaultGrid').innerHTML = state.songs.map(song => `<button class="vault-card ${song.id === state.activeSongId ? 'active' : ''}" data-song-id="${song.id}"><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.status)} • ${escapeHtml(song.energy)}</small><small>${song.notes ? escapeHtml(song.notes.slice(0,90)) : 'No notes yet.'}</small></button>`).join('');
  }

  function selectSong(id) {
    state.activeSongId = id;
    const song = currentSong();
    if (song) {
      $('lyricsDraft').value = song.lyrics || '';
      $('stylePrompt').value = song.stylePrompt || '';
      $('excludePrompt').value = song.excludePrompt || '';
    }
    saveState();
    renderHome();
    renderVault();
    renderMemories();
    toast(`${song?.title || 'Song'} is now active.`);
  }

  function hydrateDrafts() {
    $('lyricsDraft').value = currentSong()?.lyrics || state.drafts.lyrics || '';
    $('stylePrompt').value = currentSong()?.stylePrompt || state.drafts.stylePrompt || '';
    $('excludePrompt').value = currentSong()?.excludePrompt || state.drafts.excludePrompt || '';
    $('visualPrompt').value = state.drafts.visualPrompt || '';
    $('campaignOut').value = state.drafts.campaignOut || '';
  }

  async function copyText(text, label = 'Copied.') {
    try { await navigator.clipboard.writeText(text); toast(label); }
    catch { toast('Copy failed — select the text manually.'); }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mr-darkness-hq-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function testConnection() {
    if (!isBackendConfigured()) return toast('Backend URL has not been configured in config.js yet.');
    if (!accessToken()) return toast('Save your access token first.');
    $('testConnection').disabled = true;
    try {
      const result = await callBrain({ action: 'ping' });
      setConnection(true);
      toast(result.message || 'Mr Darkness brain is online.');
    } catch (err) { setConnection(false); toast(err.message); }
    finally { $('testConnection').disabled = false; }
  }

  function bind() {
    $$('.nav button').forEach(b => b.addEventListener('click', () => navigate(b.dataset.view)));
    $$('[data-jump]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.jump)));
    $('menu').addEventListener('click', () => $('sidebar').classList.toggle('open'));

    $('saveCanon').addEventListener('click', () => {
      $$('[data-canon]').forEach(el => state.canon[el.dataset.canon] = el.value.trim());
      saveState('CANON SAVED'); renderHome(); renderMemories(); toast('Canon updated everywhere.');
    });
    $('resetCanon').addEventListener('click', () => { state.canon = { ...DEFAULT_CANON }; saveState(); renderCanon(); renderMemories(); toast('Canon reset to Mr Darkness defaults.'); });

    $('saveSong').addEventListener('click', saveSong);
    $('saveLyrics').addEventListener('click', () => { state.drafts.lyrics = $('lyricsDraft').value; if (currentSong()) { currentSong().lyrics = $('lyricsDraft').value; currentSong().updatedAt = Date.now(); } saveState(); toast('Lyrics saved.'); });

    $$('.mode').forEach(b => b.addEventListener('click', () => { state.activeMode = b.dataset.mode; saveState(); renderMode(); }));
    $('askSend').addEventListener('click', sendChat);
    $('askInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
    $('starters').addEventListener('click', e => { const b = e.target.closest('[data-starter]'); if (b) { $('askInput').value = b.dataset.starter; $('askInput').focus(); } });
    $('newChat').addEventListener('click', () => { state.chat = []; saveState(); renderChat(); toast('New conversation started. Memory kept.'); });
    $('clearChat').addEventListener('click', () => { state.chat = []; saveState(); renderChat(); });
    $('teachLike').addEventListener('click', () => addMemory('like', $('askInput').value));
    $('teachDislike').addEventListener('click', () => addMemory('dislike', $('askInput').value));
    $('copyContext').addEventListener('click', () => copyText(buildContextText(), 'Full Mr Darkness context copied.'));
    $('addLike').addEventListener('click', () => { addMemory('like', $('likeInput').value); $('likeInput').value = ''; });
    $('addDislike').addEventListener('click', () => { addMemory('dislike', $('dislikeInput').value); $('dislikeInput').value = ''; });
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-memory]');
      if (b) {
        const list = b.dataset.memory === 'like' ? state.memories.likes : state.memories.dislikes;
        list.splice(Number(b.dataset.index), 1); saveState(); renderMemories(); renderHome();
      }
      const song = e.target.closest('[data-song-id]');
      if (song) selectSong(song.dataset.songId);
    });

    $('lyricBrief').addEventListener('click', buildLyricBrief);
    $('buildSuno').addEventListener('click', localSunoBuild);
    $('buildVisual').addEventListener('click', localVisualBuild);
    $('buildCampaign').addEventListener('click', localCampaignBuild);
    $$('.ai-action').forEach(b => b.addEventListener('click', () => runAIAction(b.dataset.aiAction)));
    $$('.copy-btn').forEach(b => b.addEventListener('click', () => copyText($(b.dataset.copy).value)));
    $('exportData').addEventListener('click', exportData);

    $('settingsBtn').addEventListener('click', () => {
      $('accessToken').value = accessToken();
      $('backendLabel').textContent = isBackendConfigured() ? `${cfg.supabaseUrl} / ${cfg.functionName}` : 'Not configured yet';
      $('settingsDialog').showModal();
    });
    $('saveSettings').addEventListener('click', e => {
      e.preventDefault();
      const token = $('accessToken').value.trim();
      if (token) localStorage.setItem(ACCESS_KEY, token); else localStorage.removeItem(ACCESS_KEY);
      $('settingsDialog').close();
      toast('Connection settings saved on this device.');
    });
    $('testConnection').addEventListener('click', testConnection);
  }

  function init() {
    renderHome(); renderCanon(); renderMemories(); renderMode(); renderChat(); renderVault(); hydrateDrafts(); bind();
    setConnection(false, isBackendConfigured() && accessToken() ? 'AI READY' : 'LOCAL BRAIN');
  }

  init();
})();