import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Base URL detection: force Android emulator to 10.0.2.2
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator special host (works with Android Studio + Expo Go emulator)
    return 'http://10.0.2.2:3001';
  }
  // For iOS simulator / web on the same machine
  return 'http://127.0.0.1:3001';
};

export async function sendToArduino(message) {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg: String(message) }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
