/**
 * WebRTC ICE and TURN/STUN Configuration
 *
 * Avoids rate-limited / unstable hardcoded public TURN credentials.
 * Prioritizes reliable public STUN servers and integrates custom private TURN
 * servers only when configured via environment variables.
 */

export const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun.cloudflare.com:3478',
    ],
  },
];

export interface WebRtcEnvConfig {
  VITE_TURN_URLS?: string;
  VITE_TURN_USERNAME?: string;
  VITE_TURN_CREDENTIAL?: string;
  VITE_STUN_URLS?: string;
}

/**
 * Resolves WebRTC ICE servers safely.
 * When custom TURN servers are not configured, only reliable STUN servers are returned
 * to prevent ICE candidate gathering timeouts and connection failures caused by dead public relays.
 */
export const getWebRtcIceServers = (
  env: WebRtcEnvConfig = import.meta.env as unknown as WebRtcEnvConfig,
): RTCIceServer[] => {
  const iceServers: RTCIceServer[] = [];

  // 1. Configured or Default STUN servers
  if (env.VITE_STUN_URLS) {
    const customStunUrls = env.VITE_STUN_URLS.split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (customStunUrls.length > 0) {
      iceServers.push({ urls: customStunUrls });
    }
  } else {
    iceServers.push(...DEFAULT_STUN_SERVERS);
  }

  // 2. Enterprise / Private TURN servers (only if fully configured)
  const turnUrlsRaw = env.VITE_TURN_URLS?.trim();
  const turnUsername = env.VITE_TURN_USERNAME?.trim();
  const turnCredential = env.VITE_TURN_CREDENTIAL?.trim();

  if (turnUrlsRaw && turnUsername && turnCredential) {
    const turnUrls = turnUrlsRaw
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    if (turnUrls.length > 0) {
      iceServers.push({
        urls: turnUrls,
        username: turnUsername,
        credential: turnCredential,
      });
    }
  }

  return iceServers;
};
