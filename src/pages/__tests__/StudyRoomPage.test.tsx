import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import StudyRoomPage from '../StudyRoomPage';

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
    subscribe: vi.fn((cb) => cb('SUBSCRIBED')),
    track: vi.fn(),
    send: vi.fn(),
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
            single: vi.fn(() => Promise.resolve({ data: { full_name: 'Soyilov' }, error: null })),
          })),
        })),
      })),
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
  };
});

// Mock Tldraw to avoid heavy canvas library setup
vi.mock('tldraw', () => ({
  Tldraw: () => <div data-testid="tldraw-whiteboard">Whiteboard Canvas</div>,
  getSnapshot: vi.fn(() => ({})),
  loadSnapshot: vi.fn(),
}));

// Mock Audio

window.Audio = vi.fn().mockImplementation(() => ({ play: vi.fn() })) as any;

describe('StudyRoomPage Custom WebRTC', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock mediaDevices
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [{ enabled: true }],
      getVideoTracks: () => [{ enabled: true, onended: null }],
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

    // Mock RTCPeerConnection

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

  it('should show pre-join preview and Boshlash button initially', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/room/library']}>
          <Routes>
            <Route path="/room/:roomId" element={<StudyRoomPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    // Check if "Dars Xonasi Tayyor" heading exists
    expect(screen.getByText(/Dars Xonasi Tayyor/i)).toBeInTheDocument();

    // Check if "Darsni boshlash" button exists
    const startButton = screen.getByRole('button', { name: /Darsni boshlash/i });
    expect(startButton).toBeInTheDocument();
  });

  it('should transition to active call and show Screen Share button when clicking Boshlash button', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/room/library']}>
          <Routes>
            <Route path="/room/:roomId" element={<StudyRoomPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    // Click "Darsni boshlash"
    const startButton = screen.getByRole('button', { name: /Darsni boshlash/i });
    await act(async () => {
      fireEvent.click(startButton);
    });

    // "Darsni boshlash" screen should disappear
    expect(screen.queryByText(/Dars Xonasi Tayyor/i)).not.toBeInTheDocument();

    // Screen share button (Monitor icon / title "Ekranni ulashish") should now be visible
    const shareButton = screen.getByTitle(/Ekranni ulashish/i);
    expect(shareButton).toBeInTheDocument();
  });
});
