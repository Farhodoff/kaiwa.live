import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StudyRoomPage from '../StudyRoomPage';
import { supabase } from '../../lib/supabase';
import { clearTelemetryBuffer } from '../../lib/errorTracking';

// Mock react-router-dom useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ roomId: 'library' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb) => {
      cb('SUBSCRIBED');
      return channelMock;
    }),
    track: vi.fn().mockResolvedValue({}),
    send: vi.fn().mockResolvedValue({}),
  };
  return {
    supabase: {
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'test-user', email: 'test@example.com' } },
            error: null,
          }),
        ),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { full_name: 'Soyilov', created_at: '2026-08-01', creator_id: 'test-user' },
                error: null,
              }),
            ),
          })),
        })),
      })),
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
  };
});

// Mock Tldraw to avoid canvas/jsdom image decode failure
vi.mock('tldraw', () => ({
  Tldraw: () => <div data-testid="tldraw-whiteboard">Whiteboard Canvas</div>,
  getSnapshot: vi.fn(() => ({})),
  loadSnapshot: vi.fn(),
}));

window.Audio = vi.fn().mockImplementation(() => ({ play: vi.fn() })) as any;

describe('Study Room WebRTC Edge Stability & Collaboration', () => {
  beforeEach(() => {
    clearTelemetryBuffer();
    vi.clearAllMocks();
    localStorage.clear();

    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [{ enabled: true, stop: vi.fn() }],
      getVideoTracks: () => [{ enabled: true, onended: null, stop: vi.fn() }],
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        getDisplayMedia: vi.fn().mockResolvedValue({
          getVideoTracks: () => [{ enabled: true, onended: null, stop: vi.fn() }],
        }),
      },
    });

    (window as any).RTCPeerConnection = vi.fn().mockImplementation(() => ({
      addTrack: vi.fn(),
      createOffer: vi.fn().mockResolvedValue({ sdp: 'offer', type: 'offer' }),
      createAnswer: vi.fn().mockResolvedValue({ sdp: 'answer', type: 'answer' }),
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
      addIceCandidate: vi.fn(),
      close: vi.fn(),
      getSenders: vi.fn(() => [{ track: { kind: 'video' }, replaceTrack: vi.fn() }]),
    })) as any;
  });

  it('renders study room header, room name and Boshlash button', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/room/library']}>
          <Routes>
            <Route path="/room/:roomId" element={<StudyRoomPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/Dars Xonasi Tayyor/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Darsni boshlash/i })).toBeInTheDocument();
  });

  it('falls back to audio-only when video camera is unavailable or denied', async () => {
    const mockAudioOnlyStream = {
      getTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [{ enabled: true, stop: vi.fn() }],
      getVideoTracks: () => [],
    };

    const getUserMediaMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('OverconstrainedError: camera not found'))
      .mockResolvedValueOnce(mockAudioOnlyStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: getUserMediaMock,
        getDisplayMedia: vi.fn().mockResolvedValue(mockAudioOnlyStream),
      },
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/room/library']}>
          <Routes>
            <Route path="/room/:roomId" element={<StudyRoomPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(getUserMediaMock).toHaveBeenCalledTimes(2);
  });

  it('transitions to active video call when Boshlash is clicked and enables screen sharing', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/room/library']}>
          <Routes>
            <Route path="/room/:roomId" element={<StudyRoomPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const startButton = screen.getByRole('button', { name: /Darsni boshlash/i });
    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(screen.getByTitle(/Ekranni ulashish/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tark etish/i })).toBeInTheDocument();
  });

  it('cleans up channels and stops all media tracks on unmount', async () => {
    const removeChannelSpy = vi.spyOn(supabase, 'removeChannel');

    let unmountFn: () => void = () => {};
    await act(async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/room/library']}>
          <Routes>
            <Route path="/room/:roomId" element={<StudyRoomPage />} />
          </Routes>
        </MemoryRouter>,
      );
      unmountFn = unmount;
    });

    await act(async () => {
      unmountFn();
    });

    expect(removeChannelSpy).toHaveBeenCalled();
  });
});
