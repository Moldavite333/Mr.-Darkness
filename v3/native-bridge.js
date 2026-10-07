(() => {
  'use strict';

  const VERIFIED_KEY = 'mr-darkness-chatgpt-plan-verified-v1';
  const MODEL_KEY = 'mr-darkness-chatgpt-plan-model-v1';
  const VERIFY_ERROR_KEY = 'mr-darkness-chatgpt-plan-error-v1';
  const STORE_KEY = 'mr-darkness-hq-v3';

  const getPlugin = () => {
    try {
      return window.Capacitor?.Plugins?.ChatGPTPlan || window.ChatGPTPlan || null;
    } catch { return null; }
  };

  const isVerified = () => localStorage.getItem(VERIFIED_KEY) === 'true';
  const setVerified = value => {
    if (value) localStorage.setItem(VERIFIED_KEY, 'true');
    else localStorage.removeItem(VERIFIED_KEY);
  };
  const getVerifyError = () => localStorage.getItem(VERIFY_ERROR_KEY) || '';
  const setVerifyError = value => {
    if (value) localStorage.setItem(VERIFY_ERROR_KEY, String(value));
    else localStorage.removeItem(VERIFY_ERROR_KEY);
  };

  const getModels = async plugin => {
    const result = await plugin.listModels();
    return Array.isArray(result?.models) ? result.models.filter(m => m?.slug || m?.id) : [];
  };

  const saveModel = model => {
    if (!model) return;
    localStorage.setItem(MODEL_KEY, model);
    try {
      const state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (state?.brain) {
        state.brain.model = model;
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      }
    } catch {}
  };

  const chooseModel = models => {
    const saved = localStorage.getItem(MODEL_KEY) || '';
    if (saved && models.some(m => (m.slug || m.id) === saved)) return saved;
    return models[0]?.slug || models[0]?.id || '';
  };

  async function verifyConnection(plugin) {
    const raw = await plugin.getStatus();
    if (!raw?.connected || !raw?.planSharing) {
      setVerified(false);
      throw new Error('ChatGPT sign-in did not finish saving a plan-sharing session.');
    }

    const models = await getModels(plugin);
    if (!models.length) {
      setVerified(false);
      throw new Error('ChatGPT authorized this app, but no plan-sharing models were returned for this account.');
    }

    const model = chooseModel(models);
    const test = await plugin.respond({
      model,
      instructions: 'Connection diagnostic only. Follow the user instruction exactly and do not add commentary.',
      input: 'Reply exactly with the single word ONLINE.'
    });

    if (!test?.text || !/\bONLINE\b/i.test(test.text)) {
      setVerified(false);
      throw new Error('ChatGPT authorization succeeded, but the direct inference test did not complete correctly.');
    }

    saveModel(test.model || model);
    setVerifyError('');
    setVerified(true);
    return { available: true, ...raw, connected: true, verified: true, authorized: true, model: test.model || model, models };
  }

  const bridge = {
    get available() { return Boolean(getPlugin()); },

    async status() {
      const plugin = getPlugin();
      if (!plugin) return { available: false, connected: false, verified: false, mode: 'browser' };
      try {
        const raw = await plugin.getStatus();
        if (!raw?.connected || !raw?.planSharing) {
          setVerified(false);
          return { available: true, ...raw, connected: false, verified: false, authorized: false, error: getVerifyError() };
        }

        if (!isVerified()) {
          try {
            return await verifyConnection(plugin);
          } catch (error) {
            const message = error?.message || String(error);
            setVerifyError(message);
            setVerified(false);
            return { available: true, ...raw, connected: false, verified: false, authorized: true, error: message };
          }
        }

        return { available: true, ...raw, connected: true, verified: true, authorized: true, error: '' };
      } catch (error) {
        const message = error?.message || String(error);
        setVerifyError(message);
        setVerified(false);
        return { available: true, connected: false, verified: false, error: message };
      }
    },

    async connect() {
      const plugin = getPlugin();
      if (!plugin) throw new Error('ChatGPT plan sharing is only available in the local Android build.');

      setVerified(false);
      setVerifyError('');
      try {
        let raw = await plugin.getStatus().catch(() => null);
        if (!raw?.connected || !raw?.planSharing) {
          await plugin.signIn({ agentName: 'Mr Darkness HQ' });
        }
        return await verifyConnection(plugin);
      } catch (error) {
        const message = error?.message || String(error);
        setVerifyError(message);
        setVerified(false);
        throw error;
      }
    },

    async disconnect() {
      const plugin = getPlugin();
      setVerified(false);
      setVerifyError('');
      if (!plugin) return;
      return plugin.signOut();
    },

    async models() {
      const plugin = getPlugin();
      if (!plugin) return [];
      return getModels(plugin);
    },

    async ask({ model, instructions, input }) {
      const plugin = getPlugin();
      if (!plugin) throw new Error('Native ChatGPT bridge is not available in this browser build.');
      const status = await bridge.status();
      if (!status.connected) {
        throw new Error(status.error || 'ChatGPT connection is not verified. Tap CONTINUE WITH CHATGPT first.');
      }
      const chosen = model || localStorage.getItem(MODEL_KEY) || '';
      const result = await plugin.respond({ model: chosen, instructions, input });
      if (!result?.text) throw new Error(result?.error || 'ChatGPT returned no text.');
      if (result.model) saveModel(result.model);
      return result;
    }
  };

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); }
    catch { return null; }
  }

  function writeState(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
  }

  function activeSong(state) {
    return state?.songs?.find(s => s.id === state.activeSongId) || state?.songs?.[0] || null;
  }

  function modeInstruction(mode) {
    const modes = {
      producer: 'Act as Mr Darkness’s record producer. Think in arrangement, dynamics, instrumentation, transitions, mix perspective and song identity. Make specific production decisions.',
      song_doctor: 'Act as a song doctor. Diagnose drift between generations and preserve locked traits while making the smallest useful corrections.',
      lyric_writer: 'Act as Mr Darkness’s lyric writer/editor. The darkness comes from the idea, not the vocabulary. Use skeptical social observation, cosmic curiosity, existential absurdity, introspection, dry wit and underlying compassion without imitating any specific writer. Favor concrete behavior, ordinary objects, contradictions, conversational turns, varied syntax, imperfect rhyme and useful rough edges. Preserve strong odd lines instead of polishing them into AI lyricism. Write for a deep low baritone with natural stresses and no forced rhyme. STRICT LYRIC WRITER CONTRACT: unless the user explicitly asks for critique, analysis, meter, explanation or notes, return ONLY the finished or revised lyrics and nothing else. No preface. No postscript. No title. No markdown headings. No bullets. No timestamps. No durations. No clock times. No production notes. No vocal directions. No arrangement instructions. No parenthetical performance commentary. No text such as instrumental-establish the pulse. Use only compact Suno-safe section tags when structurally useful: [Verse 1], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Instrumental], [Outro]. Everything else inside the lyric block must be words intended to be sung. Wrap actual lyrics in <lyrics> and </lyrics>. If the user explicitly asks for critique or analysis, answer that request without reproducing the full lyric unless asked.',
      suno_engineer: 'Act as a Suno prompt engineer. Keep STYLE and EXCLUDE separate, dense and copy-ready. Each must remain under 1000 characters.',
      album_director: 'Act as an album producer. Analyze continuity, contrast, sequence, tempo/energy shape and repeated arrangement habits.',
      visual_director: 'Act as a visual director maintaining one recognizable Mr Darkness character and one 1980s underground world.',
      release_director: 'Act as a release director. Preserve mystery, avoid influencer language, and build practical teaser/release sequences.'
    };
    return modes[mode] || modes.producer;
  }

  function buildInstructions(state, mode) {
    const song = activeSong(state);
    let context;
    if (mode === 'lyric_writer') {
      context = {
        canon: { lyrics: state?.canon?.lyrics || '' },
        vocalDNA: {
          register: state?.vocal?.register || '',
          movement: state?.vocal?.movement || '',
          diction: state?.vocal?.diction || ''
        },
        likes: state?.preferences?.likes || [],
        dislikes: state?.preferences?.dislikes || [],
        activeSong: song ? {
          title: song.title, thesis: song.thesis, anchor: song.anchor,
          lyrics: song.lyrics, lyricLab: song.lyricLab || null, phraseBank: song.phraseBank || []
        } : null
      };
    } else {
      const albumSongs = (state?.songs || []).filter(s => /selected|mixing|release ready/i.test(s.status || ''));
      const album = (albumSongs.length ? albumSongs : (state?.songs || [])).map(s => ({
        title: s.title, status: s.status, bpm: s.bpm, mode: s.mode, energy: s.energy,
        targetLength: s.targetLength, thesis: s.thesis
      }));
      const latestGeneration = song?.generations?.[song.generations.length - 1] || null;
      context = {
        canon: state?.canon,
        vocalDNA: state?.vocal,
        likes: state?.preferences?.likes || [],
        dislikes: state?.preferences?.dislikes || [],
        activeSong: song ? {
          title: song.title, status: song.status, thesis: song.thesis, anchor: song.anchor,
          bpm: song.bpm, key: song.key, mode: song.mode, targetLength: song.targetLength,
          groove: song.groove, energy: song.energy, roles: song.roles, arrangement: song.arrangement,
          lyrics: song.lyrics, lyricLab: song.lyricLab || null, songVocalNote: song.songVocalNote, suno: song.suno, latestGeneration
        } : null,
        album
      };
    }
    return [
      'You are working inside MR DARKNESS HQ, a production workstation for one recurring fictional 1980s goth/darkwave artist.',
      modeInstruction(mode),
      mode === 'lyric_writer'
        ? 'Use only the lyric-writing context below. Do not infer or reproduce timing, production directions, arrangement notes or timestamps from any other part of the project.'
        : 'Treat the supplied canon, vocal DNA, likes/don’ts, active song and generation locks as source-of-truth constraints. Diagnose drift specifically. For Suno prompts, target 850–900 characters and never exceed 999 characters per prompt.',
      'PROJECT CONTEXT\n' + JSON.stringify(context, null, 2)
    ].join('\n\n');
  }
  function displayStoredText(text) {
    return String(text || '').replace(/<\/?lyrics>/gi, '').trim();
  }

  function renderStoredMessages(state) {
    const host = document.getElementById('brainMessages');
    if (!host) return;
    const messages = state?.brain?.messages || [];
    host.replaceChildren();
    if (!messages.length) {
      const box = document.createElement('div');
      box.className = 'brain-message md';
      const tag = document.createElement('span'); tag.textContent = 'MR DARKNESS';
      const p = document.createElement('p'); p.textContent = 'I already know the active song, production sheet, vocal DNA, generations, likes, don’ts and album context. Ask from where you are.';
      box.append(tag, p); host.append(box); return;
    }
    messages.forEach((message, index) => {
      const box = document.createElement('div');
      box.className = `brain-message ${message.role === 'user' ? 'user' : 'md'}`;
      const head = document.createElement('div'); head.className = 'brain-message-head';
      const tag = document.createElement('span');
      tag.textContent = `${message.role === 'user' ? 'YOU' : 'MR DARKNESS'} // ${(message.mode || 'producer').replaceAll('_', ' ').toUpperCase()}`;
      const actions = document.createElement('div'); actions.className = 'message-actions';
      if (message.role !== 'user') {
        const copyLyrics = document.createElement('button');
        copyLyrics.type = 'button'; copyLyrics.className = 'message-copy'; copyLyrics.dataset.copyBrainLyrics = String(index); copyLyrics.textContent = 'COPY LYRICS';
        const toLyrics = document.createElement('button');
        toLyrics.type = 'button'; toLyrics.className = 'message-copy'; toLyrics.dataset.sendBrainLyrics = String(index); toLyrics.textContent = 'TO LYRICS';
        actions.append(copyLyrics, toLyrics);
      }
      const copy = document.createElement('button');
      copy.type = 'button'; copy.className = 'message-copy'; copy.dataset.copyBrain = String(index); copy.textContent = 'COPY ANSWER';
      actions.append(copy); head.append(tag, actions);
      const p = document.createElement('p'); p.textContent = displayStoredText(message.text || '');
      box.append(head, p); host.append(box);
    });
    host.scrollTop = host.scrollHeight;
  }
  function addStoredMessage(role, text, mode) {
    const state = readState();
    if (!state) return;
    if (!state.brain) state.brain = { mode: mode || 'producer', messages: [], model: '' };
    if (!Array.isArray(state.brain.messages)) state.brain.messages = [];
    state.brain.messages.push({ role, text, mode: mode || state.brain.mode || 'producer', at: Date.now() });
    state.brain.messages = state.brain.messages.slice(-40);
    const song = activeSong(state);
    if (song) song.brainMessages = state.brain.messages.slice(-40);
    writeState(state);
    renderStoredMessages(state);
  }

  function applyStatusToUi(status) {
    const heading = document.getElementById('brainConnection');
    const sub = document.getElementById('brainConnectionSub');
    const nativeStatus = document.getElementById('nativeStatus');
    const button = document.getElementById('nativeConnectBtn');
    const label = document.getElementById('brainLabel');
    const brainButton = document.getElementById('brainBtn');
    if (!heading || !sub || !button) return;

    if (status?.connected) {
      heading.textContent = 'CHATGPT PLAN CONNECTED';
      sub.textContent = status.email ? `Signed in as ${status.email}` : `Verified direct ChatGPT plan connection${status.model ? ` · ${status.model}` : ''}`;
      if (nativeStatus) nativeStatus.textContent = 'Connected and verified';
      if (label) label.textContent = 'CHATGPT ONLINE';
      brainButton?.classList.add('native');
      button.textContent = 'CONNECTED';
      button.disabled = true;
      document.querySelectorAll('.native-brain-action').forEach(x => x.hidden = false);
      document.querySelectorAll('.browser-brain-action').forEach(x => x.hidden = true);
      return;
    }

    brainButton?.classList.remove('native');
    if (status?.authorized) {
      heading.textContent = 'CHATGPT AUTHORIZED — TEST FAILED';
      sub.textContent = status.error || 'Authorization is saved, but the direct inference test has not passed yet.';
      if (nativeStatus) nativeStatus.textContent = status.error || 'Authorized; verification failed';
      button.textContent = 'RETRY CONNECTION TEST';
      button.disabled = false;
      document.querySelectorAll('.native-brain-action').forEach(x => x.hidden = true);
      document.querySelectorAll('.browser-brain-action').forEach(x => x.hidden = false);
      return;
    }

    if (status?.error) {
      heading.textContent = 'CHATGPT SIGN-IN INCOMPLETE';
      sub.textContent = status.error;
      if (nativeStatus) nativeStatus.textContent = status.error;
      button.textContent = 'CONTINUE WITH CHATGPT';
      button.disabled = false;
      document.querySelectorAll('.native-brain-action').forEach(x => x.hidden = true);
      document.querySelectorAll('.browser-brain-action').forEach(x => x.hidden = false);
      return;
    }

    heading.textContent = 'NATIVE BRIDGE READY';
    sub.textContent = 'Connect your ChatGPT account to use plan sharing.';
    if (nativeStatus) nativeStatus.textContent = 'Detected — not signed in';
    button.textContent = 'CONTINUE WITH CHATGPT';
    button.disabled = false;
    document.querySelectorAll('.native-brain-action').forEach(x => x.hidden = true);
    document.querySelectorAll('.browser-brain-action').forEach(x => x.hidden = false);
  }

  async function surfaceNativeStatus() {
    if (!getPlugin()) return;
    const status = await bridge.status();
    applyStatusToUi(status);
  }

  function isLyricAnalysisRequest(text) {
    return /\b(analy[sz]e|analysis|critique|feedback|meter|syllable|singability|explain|why|notes?|diagnose|what works|what doesn't|what does not)\b/i.test(String(text || ''));
  }

  function normalizeSectionTag(raw) {
    let value = String(raw || '').replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').replace(/__/g, '').replace(/`/g, '').trim();
    value = value.replace(/^\[|\]$/g, '').replace(/\s*[-–—·]\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*$/, '').trim();
    const lower = value.toLowerCase();
    const num = (value.match(/\b(\d+)\b/) || [])[1] || '';
    if (/\binstrumental\b/.test(lower) && /\bintro\b/.test(lower)) return '[Instrumental Intro]';
    if (/\binstrumental\b/.test(lower) && /\boutro\b/.test(lower)) return '[Instrumental Outro]';
    if (/\binstrumental\b/.test(lower)) return '[Instrumental]';
    const rules = [['pre-chorus','Pre-Chorus'],['pre chorus','Pre-Chorus'],['lift','Pre-Chorus'],['build','Pre-Chorus'],['verse','Verse'],['chorus','Chorus'],['bridge','Bridge'],['refrain','Refrain'],['intro','Intro'],['outro','Outro'],['interlude','Interlude'],['breakdown','Breakdown'],['hook','Hook']];
    for (const [needle,label] of rules) { if (lower.includes(needle)) return num ? '['+label+' '+num+']' : '['+label+']'; }
    return null;
  }

  function cleanLyricOnlyText(raw) {
    const source = String(raw || '');
    const tagged = source.match(/<lyrics>([\s\S]*?)<\/lyrics>/i);
    const body = tagged ? tagged[1] : source;
    const lines = body.replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let started = Boolean(tagged);
    for (const original of lines) {
      const trimmed = original.trim();
      if (!trimmed) { if (started && out.length && out[out.length - 1] !== '') out.push(''); continue; }
      const sectionish = /^(?:#{1,6}\s*)?(?:\*\*)?(?:\[[^\]]+\]|(?:verse|chorus|pre[- ]?chorus|bridge|refrain|intro|outro|interlude|breakdown|hook|lift|build|instrumental)\b.*?)(?:\*\*)?$/i.test(trimmed);
      if (sectionish) { const tag = normalizeSectionTag(trimmed); if (tag) { out.push(tag); started = true; } continue; }
      if (!started) continue;
      if (/^\s*(?:[-*]\s*)?(?:singability|edit notes?|notes?|production|delivery lock|strongest new images?|emotional turn|why this works|analysis|commentary)\b/i.test(trimmed)) break;
      if (/^\*.*\*$/.test(trimmed)) continue;
      let line = original.replace(/\*\*/g, '').replace(/__/g, '').replace(/`/g, '').replace(/^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*[-–—:|]\s*/, '').replace(/\s*[-–—,;|]\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\s*$/, '').replace(/\s*\((?:\d{1,2}:)?\d{1,2}:\d{2}\)\s*$/, '').trimEnd();
      if (line.trim()) out.push(line);
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function normalizeLyricWriterReply(reply, request) {
    if (isLyricAnalysisRequest(request)) return reply;
    const lyrics = cleanLyricOnlyText(reply);
    return lyrics ? '<lyrics>' + lyrics + '</lyrics>' : reply;
  }
  async function nativeAskFromUi() {
    const input = document.getElementById('brainInput');
    const button = document.getElementById('brainSend');
    const text = String(input?.value || '').trim();
    if (!text || !button) return;

    const state = readState();
    const mode = state?.brain?.mode || 'producer';
    addStoredMessage('user', text, mode);
    input.value = '';
    button.disabled = true;
    button.textContent = 'THINKING…';

    try {
      const status = await bridge.status();
      applyStatusToUi(status);
      if (!status.connected) throw new Error(status.error || 'ChatGPT is not verified yet. Tap CONTINUE WITH CHATGPT first.');
      const freshState = readState();
      const result = await bridge.ask({
        model: freshState?.brain?.model || localStorage.getItem(MODEL_KEY) || '',
        instructions: buildInstructions(freshState, mode),
        input: text
      });
      const reply = mode === 'lyric_writer' ? normalizeLyricWriterReply(result.text, text) : result.text;
      addStoredMessage('assistant', reply, mode);
    } catch (error) {
      addStoredMessage('assistant', `Connection problem: ${error?.message || String(error)}`, mode);
    } finally {
      button.disabled = false;
      button.textContent = 'ASK';
    }
  }

  // In the Android shell, ASK must never silently fall back to opening chatgpt.com.
  // Capture the button before the browser-fallback handler in app.js can run.
  document.addEventListener('click', event => {
    if (!getPlugin()) return;
    const askButton = event.target?.closest?.('#brainSend');
    if (!askButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    nativeAskFromUi();
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(surfaceNativeStatus, 250);
  });
  window.addEventListener('focus', () => setTimeout(surfaceNativeStatus, 250));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(surfaceNativeStatus, 500), { once: true });
  } else {
    setTimeout(surfaceNativeStatus, 500);
  }

  window.MDNative = bridge;
})();
