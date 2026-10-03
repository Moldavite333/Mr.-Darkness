(() => {
  'use strict';

  const VERIFIED_KEY = 'mr-darkness-chatgpt-plan-verified-v1';
  const MODEL_KEY = 'mr-darkness-chatgpt-plan-model-v1';
  const ERROR_KEY = 'mr-darkness-chatgpt-plan-error-v1';
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
  const getLastError = () => localStorage.getItem(ERROR_KEY) || '';
  const setLastError = value => {
    if (value) localStorage.setItem(ERROR_KEY, String(value));
    else localStorage.removeItem(ERROR_KEY);
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

  async function rawStatus(plugin = getPlugin()) {
    if (!plugin) return { available: false, connected: false, planSharing: false };
    return plugin.getStatus();
  }

  async function verifyConnection(plugin = getPlugin()) {
    if (!plugin) throw new Error('Native ChatGPT bridge is unavailable.');
    setVerified(false);
    setLastError('');

    try {
      const raw = await rawStatus(plugin);
      if (!raw?.connected || !raw?.planSharing) {
        throw new Error('The browser sign-in did not leave a usable ChatGPT plan session in Mr Darkness.');
      }

      const models = await getModels(plugin);
      if (!models.length) {
        throw new Error('Authorization was saved, but OpenAI returned no plan-sharing models for this account.');
      }

      const model = chooseModel(models);
      const test = await plugin.respond({
        model,
        instructions: 'Connection diagnostic only. Follow the user instruction exactly and do not add commentary.',
        input: 'Reply exactly with the single word ONLINE.'
      });

      if (!test?.text || !/\bONLINE\b/i.test(test.text)) {
        throw new Error('Authorization and model lookup worked, but the direct Responses test did not return ONLINE.');
      }

      const activeModel = test.model || model;
      saveModel(activeModel);
      setVerified(true);
      setLastError('');
      return { available: true, ...raw, connected: true, verified: true, authorized: true, model: activeModel, models };
    } catch (error) {
      setVerified(false);
      setLastError(error?.message || String(error));
      throw error;
    }
  }

  const bridge = {
    get available() { return Boolean(getPlugin()); },

    async status() {
      const plugin = getPlugin();
      if (!plugin) return { available: false, connected: false, verified: false, authorized: false, mode: 'browser' };
      try {
        const raw = await rawStatus(plugin);
        const authorized = Boolean(raw?.connected && raw?.planSharing);
        const verified = authorized && isVerified();
        if (!authorized) setVerified(false);
        return {
          available: true,
          ...raw,
          connected: verified,
          verified,
          authorized,
          model: localStorage.getItem(MODEL_KEY) || '',
          lastError: getLastError()
        };
      } catch (error) {
        setVerified(false);
        setLastError(error?.message || String(error));
        return { available: true, connected: false, verified: false, authorized: false, error: error?.message || String(error), lastError: getLastError() };
      }
    },

    async connect() {
      const plugin = getPlugin();
      if (!plugin) throw new Error('ChatGPT plan sharing is only available in the local Android build.');

      setVerified(false);
      setLastError('');
      let raw = await rawStatus(plugin).catch(() => null);
      if (!raw?.connected || !raw?.planSharing) {
        await plugin.signIn({ agentName: 'Mr Darkness HQ' });
      }
      return verifyConnection(plugin);
    },

    async verify() {
      return verifyConnection(getPlugin());
    },

    async disconnect() {
      const plugin = getPlugin();
      setVerified(false);
      setLastError('');
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
      const raw = await rawStatus(plugin);
      if (!raw?.connected || !raw?.planSharing) {
        throw new Error('Mr Darkness does not have a saved ChatGPT plan session yet.');
      }
      if (!isVerified()) {
        throw new Error(getLastError() || 'ChatGPT authorization exists, but the direct connection test has not passed yet.');
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
      lyric_writer: 'Act as Mr Darkness’s lyric writer/editor. Prioritize meter, memorable phrasing, concrete meaning and restraint. Avoid generic goth buzzword language.',
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
        lyrics: song.lyrics, songVocalNote: song.songVocalNote, suno: song.suno, latestGeneration
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
    for (const message of messages) {
      const box = document.createElement('div');
      box.className = `brain-message ${message.role === 'user' ? 'user' : 'md'}`;
      const tag = document.createElement('span');
      tag.textContent = `${message.role === 'user' ? 'YOU' : 'MR DARKNESS'} // ${(message.mode || 'producer').replaceAll('_', ' ').toUpperCase()}`;
      const p = document.createElement('p'); p.textContent = message.text || '';
      box.append(tag, p); host.append(box);
    }
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

  function renderConnection(status, workingText = '') {
    const title = document.getElementById('brainConnection');
    const sub = document.getElementById('brainConnectionSub');
    const button = document.getElementById('nativeConnectBtn');
    const label = document.getElementById('brainLabel');
    const settings = document.getElementById('nativeStatus');
    if (!title || !sub || !button) return;

    if (workingText) {
      title.textContent = workingText;
      sub.textContent = 'Do not leave this screen; Mr Darkness is checking the saved authorization and direct model route.';
      button.textContent = 'CHECKING…';
      button.disabled = true;
      return;
    }

    if (status?.connected && status?.verified) {
      title.textContent = 'CHATGPT PLAN CONNECTED';
      sub.textContent = status.model ? `Direct connection verified · ${status.model}` : 'Direct connection verified.';
      button.textContent = 'CONNECTED';
      button.disabled = true;
      if (label) label.textContent = 'CHATGPT ONLINE';
      if (settings) settings.textContent = 'Connected and verified';
      return;
    }

    if (status?.authorized) {
      title.textContent = status.lastError ? 'CHATGPT AUTHORIZED — TEST FAILED' : 'CHATGPT AUTHORIZED — VERIFYING';
      sub.textContent = status.lastError || 'Authorization is saved. Mr Darkness still needs to complete the direct model test.';
      button.textContent = 'RETRY CONNECTION TEST';
      button.disabled = false;
      if (settings) settings.textContent = status.lastError || 'Authorized — not verified';
      return;
    }

    title.textContent = 'NATIVE BRIDGE READY';
    sub.textContent = status?.lastError || 'Connect your ChatGPT account to use plan sharing.';
    button.textContent = 'CONTINUE WITH CHATGPT';
    button.disabled = false;
    if (settings) settings.textContent = status?.lastError || 'Detected — not signed in';
  }

  async function connectFromUi() {
    const state = readState();
    const mode = state?.brain?.mode || 'producer';
    renderConnection(null, 'CONNECTING TO CHATGPT');
    try {
      const result = await bridge.connect();
      renderConnection(result);
      addStoredMessage('assistant', `ChatGPT plan connection verified. Direct responses are online${result.model ? ` through ${result.model}` : ''}.`, mode);
    } catch (error) {
      const status = await bridge.status();
      renderConnection(status);
      addStoredMessage('assistant', `Connection test failed: ${error?.message || String(error)}`, mode);
    }
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
      if (!status.connected) {
        const detail = status.lastError || (status.authorized ? 'Authorization is saved but the direct connection test has not passed.' : 'No saved ChatGPT plan session was found.');
        throw new Error(detail);
      }
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

  let autoAttempted = false;
  async function autoCheck() {
    const plugin = getPlugin();
    if (!plugin) return;
    const status = await bridge.status();
    renderConnection(status);
    if (status.authorized && !status.verified && !autoAttempted) {
      autoAttempted = true;
      renderConnection(null, 'CHATGPT AUTHORIZED — VERIFYING');
      try {
        const verified = await bridge.verify();
        renderConnection(verified);
      } catch (error) {
        const failed = await bridge.status();
        renderConnection(failed);
      }
    }
  }

  // Android: own both CONNECT and ASK so app.js cannot fall back to chatgpt.com or hide diagnostics.
  document.addEventListener('click', event => {
    if (!getPlugin()) return;
    const connectButton = event.target?.closest?.('#nativeConnectBtn');
    if (connectButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      connectFromUi();
      return;
    }
    const askButton = event.target?.closest?.('#brainSend');
    if (askButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      nativeAskFromUi();
    }
  }, true);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(autoCheck, 500);
  });

  window.MDNative = bridge;
  setTimeout(autoCheck, 1200);
})();
