/**
 * Surge Listings Desktop Application — Preload Script
 * 
 * Secure Context Isolation Bridge
 * Exposes only safe, strictly defined desktop capabilities to the renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('surgeDesktop', {
  isDesktop: true,
  platform: 'windows',
  retryConnection: () => ipcRenderer.invoke('surge:retry-connection'),
  getAppInfo: () => ipcRenderer.invoke('surge:get-app-info')
});

