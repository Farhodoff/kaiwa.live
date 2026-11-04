import { describe, it, expect } from 'vitest';
import { getWebRtcIceServers, DEFAULT_STUN_SERVERS } from '../webrtc';

describe('WebRTC ICE & TURN Configuration', () => {
  it('returns default Google and Cloudflare STUN servers when no env is configured', () => {
    const servers = getWebRtcIceServers({});
    expect(servers).toEqual(DEFAULT_STUN_SERVERS);

    // Verify no hardcoded openrelay or insecure public credentials exist in output
    const serialized = JSON.stringify(servers);
    expect(serialized).not.toContain('openrelay');
    expect(serialized).not.toContain('openrelayproject');
  });

  it('safely integrates enterprise TURN server when fully configured in env', () => {
    const servers = getWebRtcIceServers({
      VITE_TURN_URLS: 'turns:turn.kaiwa.live:5349,turn:turn.kaiwa.live:3478',
      VITE_TURN_USERNAME: 'enterprise-user',
      VITE_TURN_CREDENTIAL: 'super-secret-password',
    });

    expect(servers.length).toBe(DEFAULT_STUN_SERVERS.length + 1);
    const turnServer = servers.find((s) => s.username === 'enterprise-user');
    expect(turnServer).toBeDefined();
    expect(turnServer?.urls).toEqual(['turns:turn.kaiwa.live:5349', 'turn:turn.kaiwa.live:3478']);
    expect(turnServer?.credential).toBe('super-secret-password');
  });

  it('rejects incomplete TURN configurations (missing username or credential) to prevent ICE timeouts', () => {
    // Missing credential
    const withoutCred = getWebRtcIceServers({
      VITE_TURN_URLS: 'turn:myturn.com:3478',
      VITE_TURN_USERNAME: 'user',
    });
    expect(withoutCred).toEqual(DEFAULT_STUN_SERVERS);

    // Missing username
    const withoutUser = getWebRtcIceServers({
      VITE_TURN_URLS: 'turn:myturn.com:3478',
      VITE_TURN_CREDENTIAL: 'secret',
    });
    expect(withoutUser).toEqual(DEFAULT_STUN_SERVERS);
  });

  it('allows overriding STUN servers via VITE_STUN_URLS', () => {
    const servers = getWebRtcIceServers({
      VITE_STUN_URLS: 'stun:custom.stun.org:3478,stun:backup.stun.org:3478',
    });

    expect(servers).toEqual([{ urls: ['stun:custom.stun.org:3478', 'stun:backup.stun.org:3478'] }]);
  });
});
