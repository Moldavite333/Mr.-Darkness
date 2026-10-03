(() => {
  'use strict';

  const getPlugin = () => {
    try {
      return window.Capacitor?.Plugins?.ChatGPTPlan || window.ChatGPTPlan || null;
    } catch { return null; }
  };

  const bridge = {
    get available() { return Boolean(getPlugin()); },

    async status() {
      const plugin = getPlugin();
      if (!plugin) return { available: false, connected: false, mode: 'browser' };
      try {
        const result = await plugin.getStatus();
        return { available: true, ...result };
      } catch (error) {
        return { available: true, connected: false, error: error?.message || String(error) };
      }
    },

    async connect() {
      const plugin = getPlugin();
      if (!plugin) throw new Error('ChatGPT plan sharing is only available in the local Android build.');
      return plugin.signIn({ agentName: 'Mr Darkness HQ' });
    },

    async disconnect() {
      const plugin = getPlugin();
      if (!plugin) return;
      return plugin.signOut();
    },

    async models() {
      const plugin = getPlugin();
      if (!plugin) return [];
      const result = await plugin.listModels();
      return Array.isArray(result?.models) ? result.models : [];
    },

    async ask({ model, instructions, input }) {
      const plugin = getPlugin();
      if (!plugin) throw new Error('Native ChatGPT bridge is not available in this browser build.');
      const result = await plugin.respond({ model: model || '', instructions, input });
      if (!result?.text) throw new Error(result?.error || 'ChatGPT returned no text.');
      return result;
    }
  };

  window.MDNative = bridge;
})();
