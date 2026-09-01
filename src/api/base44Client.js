import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl: defaultBaseUrl } = appParams;

// Ambil domain tempat aplikasi saat ini dibuka di browser
const currentOrigin = typeof window !== 'undefined' ? window.location.origin : defaultBaseUrl;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: currentOrigin,
  requiresAuth: false,
  appBaseUrl: currentOrigin
});