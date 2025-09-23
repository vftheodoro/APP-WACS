import Constants from 'expo-constants';

let ws = null;
let isConnecting = false;
let listeners = new Set();

const getWsUrl = () => {
  const url = Constants.expoConfig?.extra?.WEBSOCKET_URL || Constants.manifest2?.extra?.WEBSOCKET_URL;
  return url || 'ws://localhost:3001';
};

export const connectWebSocket = () => {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return ws;
  if (isConnecting) return ws;
  const url = getWsUrl();
  try {
    isConnecting = true;
    ws = new WebSocket(url);
    ws.onopen = () => {
      isConnecting = false;
      // opcional: notificar listeners
      listeners.forEach((l) => l({ type: 'open' }));
    };
    ws.onmessage = (evt) => {
      listeners.forEach((l) => l({ type: 'message', data: evt.data }));
    };
    ws.onerror = (err) => {
      isConnecting = false;
      listeners.forEach((l) => l({ type: 'error', error: err }));
    };
    ws.onclose = () => {
      isConnecting = false;
      listeners.forEach((l) => l({ type: 'close' }));
      // reconectar simples
      setTimeout(() => connectWebSocket(), 2000);
    };
  } catch (e) {
    isConnecting = false;
  }
  return ws;
};

export const sendWsMessage = (message) => {
  try {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      return false;
    }
    ws.send(String(message));
    return true;
  } catch (e) {
    return false;
  }
};

export const isWsConnected = () => {
  return !!ws && ws.readyState === WebSocket.OPEN;
};

export const addWsListener = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
