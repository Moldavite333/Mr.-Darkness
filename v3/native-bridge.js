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
      lyric_writer: 'Act as Mr Darkness’s lyric writer/editor. The darkness comes from the idea, not the vocabulary. Use skeptical social observation, cosmic curiosity, existential absurdity, introspection, dry wit and underlying compassion without imitating any specific writer. Favor concrete behavior, ordinary objects, contradictions, conversational turns, varied syntax, imperfect rhyme and useful rough edges. Avoid stock goth vocabulary, forced rhyme, obvious symmetry, emotional inflation and over-explaining. Never make every line profound; preserve strange human lines instead of polishing them into AI lyricism. OUTPUT RULE: whenever you provide actual lyrics, NEVER include timestamps, estimated durations, clock times, markdown headings, asterisks, production notes, vocal directions, arrangement commentary, or parenthetical performance instructions inside the lyric block. Use only plain Suno-safe section tags such as [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Instrumental], [Outro], followed by words intended to be sung. Keep any craft discussion outside the lyric block. Wrap actual lyrics in <lyrics> and </lyrics> so the app can extract them safely; never put commentary inside those tags.',
      suno_engineer: 'Act as a Suno prompt engineer. Keep STYLE and EXCLUDE separate, dense and copy-ready. Each must remain under 1000 characters.',
      album_director: 'Act as an album producer. Analyze continuity, contrast, sequence, tempo/energy shape and repeated arrangement habits.',
      visual_director: 'Act as a visual director maintaining one recognizable Mr Darkness character and one 1980s underground world.',
      release_director: 'Act as a release director. Preserve mystery, avoid influencer language, and build practical teaser/release sequences.'
    };
    return modes[mode] || modes.producer;
  }

  function buildInstructions(state, mode) {
    const song = activeSong(state);
    const albumSongs = (state?.songs || []).filter(s => /selected|mixing|release ready/i.test(s.status || ''));
    const album = (albumSongs.length ? albumSongs : (state?.songs || [])).map(s => ({
      title: s.title, status: s.status, bpm: s.bpm, mode: s.mode, energy: s.energy,
      targetLength: s.targetLength, thesis: s.thesis
    }));
    const latestGeneration = song?.generations?.[song.generations.length - 1] || null;
    const context = {
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
    return [
      'You are working inside MR DARKNESS HQ, a production workstation for one recurring fictional 1980s goth/darkwave artist.',
      modeInstruction(mode),
      'Treat the supplied canon, vocal DNA, likes/don’ts, active song and generation locks as source-of-truth constraints. Diagnose drift specifically. For Suno prompts, target 850–900 characters and never exceed 999 characters per prompt.',
      `PROJECT CONTEXT\n${JSON.stringify(context, null, 2)}`
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
      addStoredMessage('assistant', result.text, mode);
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
