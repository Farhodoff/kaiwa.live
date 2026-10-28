import {
  ArrowLeft,
  VideoOff,
  Users,
  PenTool,
  Loader2,
  Mic,
  MicOff,
  Video,
  Monitor,
  MonitorOff,
  Minimize2,
  Share2,
  Check,
  Play,
  Pause,
  RotateCcw,
  Timer,
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
const RoomWhiteboard = React.lazy(() => import('../components/study-room/RoomWhiteboard'));
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { recordTelemetryEvent } from '../lib/errorTracking';
import { ActivityLoggingService } from '../services/ActivityLoggingService';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const DEFAULT_ROOM_NAMES: Record<string, string> = {
  library: 'Jimjit Kutubxona 📚',
  lofi: 'Lofi Zali 🎧',
  'group-a': "Guruhli O'qish Zali 🗣️",
};

// StudyRoomPage component handles custom WebRTC peer-to-peer audio/video streaming,
// screen sharing, and the Whiteboard collaboration synchronization.
const StudyRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { haptics } = useTelegramWebApp();

  // User Profile & Room Meta
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [roomDisplayName, setRoomDisplayName] = useState<string>("O'quv Xonasi");
  const [copiedLink, setCopiedLink] = useState(false);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  // UI State
  const [mobileView, setMobileView] = useState<'video' | 'collab'>('video');
  const [showCollabPanel, setShowCollabPanel] = useState(true);

  // WebRTC & Media States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [peersInfo, setPeersInfo] = useState<Record<string, string>>({});
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [joinedCall, setJoinedCall] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);

  // Sync userProfileRef to use inside event listeners/callbacks
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  // Realtime channel
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Sinxron Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [connectedPeers, setConnectedPeers] = useState<number>(1);

  const broadcastPomodoroState = (
    newTime: number,
    newIsRunning: boolean,
    newMode: 'focus' | 'short_break' | 'long_break',
  ) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'pomodoro_state_update',
        payload: {
          senderId: clientIdRef.current,
          timeLeft: newTime,
          isRunning: newIsRunning,
          mode: newMode,
        },
      });
    }
  };

  const handleTogglePomodoro = () => {
    haptics.impact('medium');
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    broadcastPomodoroState(timeLeft, nextRunning, pomodoroMode);
  };

  const handleResetPomodoro = () => {
    haptics.impact('light');
    const defaultTime =
      pomodoroMode === 'focus' ? 25 * 60 : pomodoroMode === 'short_break' ? 5 * 60 : 15 * 60;
    setTimeLeft(defaultTime);
    setIsRunning(false);
    broadcastPomodoroState(defaultTime, false, pomodoroMode);
  };

  // Whiteboard Ref & States
  const editorRef = useRef<any>(null);

  // Refs for closure access in channel event listeners without triggering re-renders
  const pomodoroStateRef = useRef({ timeLeft, isRunning, mode: pomodoroMode });
  useEffect(() => {
    pomodoroStateRef.current = { timeLeft, isRunning, mode: pomodoroMode };
  }, [timeLeft, isRunning, pomodoroMode]);

  const joinedCallRef = useRef(joinedCall);
  useEffect(() => {
    joinedCallRef.current = joinedCall;
  }, [joinedCall]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionRes = await supabase.auth.getSession();
        const user = sessionRes?.data?.session?.user;
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
          setUserProfile({
            id: user.id,
            name: profile?.full_name || user.email?.split('@')[0] || 'Talaba',
            email: user.email || '',
          });
        } else {
          setUserProfile({
            id: `guest-${clientIdRef.current}`,
            name: 'Mehmon Talaba',
            email: '',
          });
        }
      } catch {
        setUserProfile({
          id: `guest-${clientIdRef.current}`,
          name: 'Mehmon Talaba',
          email: '',
        });
      }
    };
    fetchUser();
  }, []);

  // Fetch local camera & microphone stream with progressive fallback
  useEffect(() => {
    const getMedia = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 15 } },
          audio: true,
        });
      } catch (videoAudioErr) {
        console.warn(
          'Video+Audio getUserMedia failed, attempting audio-only fallback:',
          videoAudioErr,
        );
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setVideoEnabled(false);
        } catch (audioErr: any) {
          console.warn('Audio-only getUserMedia also failed or was denied:', audioErr);
          setVideoEnabled(false);
          setAudioEnabled(false);
          recordTelemetryEvent('webrtc', 'Media devices access denied or unavailable', {
            metadata: { error: audioErr?.message || String(audioErr) },
          });
        }
      }
      if (stream) {
        setLocalStream(stream);
        localStreamRef.current = stream;
      }
    };
    if (userProfile) {
      getMedia();
    }
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [userProfile]);

  // Set up Realtime Sync
  useEffect(() => {
    if (!userProfile || !roomId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isComponentMounted = true;

    const createPeerConnection = (peerId: string) => {
      if (pcsRef.current[peerId]) return pcsRef.current[peerId];

      // Enterprise TURN server configuration (configured via env or fallback to openrelay)
      const configuredTurnUrls = import.meta.env.VITE_TURN_URLS
        ? import.meta.env.VITE_TURN_URLS.split(',')
        : [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp',
          ];
      const configuredTurnUsername = import.meta.env.VITE_TURN_USERNAME || 'openrelayproject';
      const configuredTurnCredential = import.meta.env.VITE_TURN_CREDENTIAL || 'openrelayproject';

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: configuredTurnUrls,
            username: configuredTurnUsername,
            credential: configuredTurnCredential,
          },
        ],
      });

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_ice_candidate',
            payload: {
              senderId: userProfile.id,
              targetId: peerId,
              candidate: event.candidate,
            },
          });
        }
      };

      // Remote stream track handler
      pc.ontrack = (event) => {
        console.log(`Received track from ${peerId}:`, event.streams[0]);
        setRemoteStreams((prev) => ({
          ...prev,
          [peerId]: event.streams[0],
        }));
      };

      // State change logger & auto-reconnect
      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          cleanupPeerConnection(peerId);
          // Schedule auto-reconnect if still in active call
          if (joinedCallRef.current && isComponentMounted) {
            setTimeout(() => {
              if (joinedCallRef.current && isComponentMounted && !pcsRef.current[peerId]) {
                createPeerConnection(peerId);
                if (userProfile.id < peerId) {
                  initiateCall(peerId);
                }
              }
            }, 2000);
          }
        } else if (pc.connectionState === 'closed') {
          cleanupPeerConnection(peerId);
        }
      };

      pcsRef.current[peerId] = pc;
      return pc;
    };

    const cleanupPeerConnection = (peerId: string) => {
      const pc = pcsRef.current[peerId];
      if (pc) {
        console.log(`Cleaning peer connection for ${peerId}`);
        try {
          pc.close();
        } catch (e) {
          // Ignore connection close errors
        }
        delete pcsRef.current[peerId];
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
    };

    const initiateCall = async (peerId: string) => {
      const pc = createPeerConnection(peerId);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channelRef.current?.send({
          type: 'broadcast',
          event: 'webrtc_offer',
          payload: {
            senderId: userProfile.id,
            targetId: peerId,
            offer,
          },
        });
      } catch (e) {
        console.error(`Error creating offer for ${peerId}:`, e);
      }
    };

    const setupChannel = async () => {
      // Determine friendly display name
      if (roomId && DEFAULT_ROOM_NAMES[roomId]) {
        setRoomDisplayName(DEFAULT_ROOM_NAMES[roomId]);
      } else if (roomId) {
        // Try querying Supabase study_rooms table
        try {
          const { data: dbRoom } = await supabase
            .from('study_rooms')
            .select('name, created_at, creator_id')
            .eq('id', roomId)
            .single();
          if (dbRoom?.name) {
            setRoomDisplayName(dbRoom.name);
          }
        } catch {
          try {
            const { data: dbRoomByRoomId } = await supabase
              .from('study_rooms')
              .select('name, created_at, creator_id')
              .eq('room_id', roomId)
              .single();
            if (dbRoomByRoomId?.name) {
              setRoomDisplayName(dbRoomByRoomId.name);
            } else {
              const cleanName = roomId.startsWith('custom_')
                ? `Maxsus Xona #${roomId.split('_')[1]?.substring(0, 6) || ''}`
                : roomId;
              setRoomDisplayName(cleanName);
            }
          } catch {
            const cleanName = roomId.startsWith('custom_')
              ? `Maxsus Xona #${roomId.split('_')[1]?.substring(0, 6) || ''}`
              : roomId;
            setRoomDisplayName(cleanName);
          }
        }
      }

      let room: { created_at?: string; creator_id?: string } | null = null;
      try {
        const { data } = await supabase
          .from('study_rooms')
          .select('created_at, creator_id')
          .eq('id', roomId)
          .single();
        room = data;
      } catch {}

      let channelName = `study-room-${roomId}`;
      if (room && room.created_at && room.creator_id) {
        const secret = btoa(`${room.created_at}-${room.creator_id}`)
          .substring(0, 16)
          .replace(/=/g, '');
        channelName = `study-room-${roomId}-${secret}`;
      }

      if (!isComponentMounted) return;

      channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: userProfile.id,
          },
        },
      });
      channelRef.current = channel;

      // Presence & Peer Tracking
      const bindChannelEvents = (ch: ReturnType<typeof supabase.channel>) => {
        ch.on('presence', { event: 'sync' }, () => {
          const state = ch.presenceState();
          setConnectedPeers(Object.keys(state).length);

          const peerIds = Object.keys(state).filter((id) => id !== userProfile.id);

          const newPeersInfo: Record<string, string> = {};
          Object.entries(state).forEach(([id, presences]) => {
            if (id !== userProfile.id) {
              const pres = presences[0] as { name?: string };
              newPeersInfo[id] = pres?.name || 'Talaba';
            }
          });
          setPeersInfo(newPeersInfo);

          // If not joined the video call, do not establish WebRTC connections
          if (!joinedCallRef.current) {
            Object.keys(pcsRef.current).forEach((peerId) => {
              cleanupPeerConnection(peerId);
            });
            return;
          }

          Object.keys(pcsRef.current).forEach((peerId) => {
            if (!peerIds.includes(peerId)) {
              cleanupPeerConnection(peerId);
            }
          });

          peerIds.forEach((peerId) => {
            if (!pcsRef.current[peerId]) {
              createPeerConnection(peerId);
              if (userProfile.id < peerId) {
                initiateCall(peerId);
              }
            }
          });
        })
          .on('presence', { event: 'join' }, ({ newPresences }) => {
            console.log('Joined peers:', newPresences);
          })
          .on('presence', { event: 'leave' }, ({ leftPresences }) => {
            console.log('Left peers:', leftPresences);
          });

        // Broadcast Message Handlers
        ch.on('broadcast', { event: 'pomodoro_state_update' }, ({ payload }) => {
          const data = payload as {
            senderId: string;
            timeLeft: number;
            isRunning: boolean;
            mode: 'focus' | 'short_break' | 'long_break';
          };
          if (data.senderId !== clientIdRef.current) {
            setTimeLeft(data.timeLeft);
            setIsRunning(data.isRunning);
            setPomodoroMode(data.mode);
          }
        })
          .on('broadcast', { event: 'request_state' }, ({ payload }) => {
            const data = payload as { requesterId: string };
            if (data.requesterId !== clientIdRef.current) {
              ch.send({
                type: 'broadcast',
                event: 'pomodoro_state_response',
                payload: {
                  timeLeft: pomodoroStateRef.current.timeLeft,
                  isRunning: pomodoroStateRef.current.isRunning,
                  mode: pomodoroStateRef.current.mode,
                  targetId: data.requesterId,
                },
              });
            }
          })
          .on('broadcast', { event: 'pomodoro_state_response' }, ({ payload }) => {
            const data = payload as {
              targetId: string;
              timeLeft: number;
              isRunning: boolean;
              mode: 'focus' | 'short_break' | 'long_break';
            };
            if (data.targetId === clientIdRef.current) {
              setTimeLeft(data.timeLeft);
              setIsRunning(data.isRunning);
              setPomodoroMode(data.mode);
            }
          })
          .on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
            if (!joinedCallRef.current) return;
            const data = payload as {
              senderId: string;
              targetId: string;
              offer: RTCSessionDescriptionInit;
            };
            if (data.targetId === userProfileRef.current?.id) {
              console.log(`Received WebRTC offer from ${data.senderId}`);
              const pc = createPeerConnection(data.senderId);
              try {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                ch.send({
                  type: 'broadcast',
                  event: 'webrtc_answer',
                  payload: {
                    senderId: userProfileRef.current?.id,
                    targetId: data.senderId,
                    answer,
                  },
                });
              } catch (e) {
                console.error('Failed to handle offer:', e);
              }
            }
          })
          .on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
            if (!joinedCallRef.current) return;
            const data = payload as {
              senderId: string;
              targetId: string;
              answer: RTCSessionDescriptionInit;
            };
            if (data.targetId === userProfileRef.current?.id) {
              console.log(`Received WebRTC answer from ${data.senderId}`);
              const pc = pcsRef.current[data.senderId];
              if (pc) {
                try {
                  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (e) {
                  console.error('Failed to handle answer:', e);
                }
              }
            }
          })
          .on('broadcast', { event: 'webrtc_ice_candidate' }, async ({ payload }) => {
            if (!joinedCallRef.current) return;
            const data = payload as {
              senderId: string;
              targetId: string;
              candidate: RTCIceCandidateInit;
            };
            if (data.targetId === userProfileRef.current?.id) {
              const pc = pcsRef.current[data.senderId];
              if (pc) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                  console.error('Failed to add ICE candidate:', e);
                }
              }
            }
          });

        // Subscribe to channel
        ch.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await ch.track({
              user_id: userProfile.id,
              name: userProfile.name,
              joined_at: new Date().toISOString(),
            });

            ch.send({
              type: 'broadcast',
              event: 'request_state',
              payload: { requesterId: clientIdRef.current },
            });
          }
        });
      };

      bindChannelEvents(channel);
    };

    setupChannel().catch((e) => console.error('Error setting up channel:', e));

    const currentPcs = pcsRef.current;
    return () => {
      isComponentMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      Object.keys(currentPcs).forEach((peerId) => {
        cleanupPeerConnection(peerId);
      });
    };
  }, [userProfile, roomId]); // Removed timeLeft, isRunning, pomodoroMode, joinedCall to prevent continuous channel recreation

  // Local Pomodoro Ticking
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            haptics.notification('success');
            try {
              const audio = new Audio(
                'https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav',
              );
              audio.play();
            } catch (e) {
              console.log('Audio blocked', e);
            }

            // Record completed focus session in focus mode
            if (pomodoroStateRef.current.mode === 'focus') {
              const activeUid =
                userProfileRef.current?.id && !userProfileRef.current.id.startsWith('guest-')
                  ? userProfileRef.current.id
                  : null;
              ActivityLoggingService.logActivity(
                {
                  activityType: 'focus',
                  activityTitle: `Study Room (${roomDisplayName}) Pomodoro Fokus`,
                  durationMinutes: 25,
                  itemsCount: 1,
                  xpEarned: 250,
                  metadata: {
                    roomId: roomId || 'library',
                    roomName: roomDisplayName,
                    peersCount: connectedPeers,
                  },
                },
                activeUid,
              ).catch((err) => console.warn('[StudyRoomPage] logActivity error:', err));
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, haptics, roomDisplayName, roomId, connectedPeers]);

  // Media Controllers
  const toggleAudio = () => {
    haptics.impact('light');
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    haptics.impact('light');
    if (isScreenSharing && screenStreamRef.current) {
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.enabled = !screenTrack.enabled;
        setVideoEnabled(screenTrack.enabled);
      }
    } else if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Screen Sharing Controllers
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        selfBrowserSurface: 'exclude',
      } as unknown as DisplayMediaStreamOptions);
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      const screenTrack = screenStream.getVideoTracks()[0];

      // Replace track in all peer connections
      Object.values(pcsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((sender) => sender.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // Create a new stream combining camera audio and screen video for local preview
      const localAudioTrack = localStreamRef.current?.getAudioTracks()[0];
      const combinedStream = new MediaStream();
      if (localAudioTrack) {
        combinedStream.addTrack(localAudioTrack);
      }
      combinedStream.addTrack(screenTrack);
      setLocalStream(combinedStream);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.error('Failed to share screen:', e);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore camera video track
    const cameraVideoTrack = localStreamRef.current?.getVideoTracks()[0];

    // Replace track in all peer connections back to camera
    Object.values(pcsRef.current).forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find((sender) => sender.track?.kind === 'video');
      if (videoSender && cameraVideoTrack) {
        videoSender.replaceTrack(cameraVideoTrack);
      }
    });

    // Restore local stream preview to original camera stream
    if (localStreamRef.current) {
      setLocalStream(localStreamRef.current);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f172a] text-white">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-500" />
        <p className="animate-pulse font-bold uppercase tracking-widest text-gray-400">
          Yuklanmoqda...
        </p>
      </div>
    );
  }

  // Whiteboard Mount Handler
  const handleWhiteboardMount = (canvas: HTMLCanvasElement | null) => {
    editorRef.current = canvas;
    return () => {};
  };

  return (
    <div className="flex h-full flex-col bg-[#0f172a] p-4 pb-[76px] font-sans text-gray-100 md:p-6 md:pb-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between rounded-2xl border border-slate-700/50 bg-[#1e293b] p-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/jlpt')}
            className="rounded-xl p-2 transition-colors hover:bg-slate-700"
          >
            <ArrowLeft size={24} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white md:text-xl">
              {roomDisplayName}
            </h1>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-green-500"></span>
              <p className="text-xs font-medium text-green-400">Sinxron Faoliyat</p>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Users size={12} /> {connectedPeers} ta talaba
              </span>
            </div>
          </div>
        </div>

        {/* Synchronized Pomodoro Live Widget */}
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-1.5 shadow-inner sm:flex">
          <Timer
            size={16}
            className={isRunning ? 'animate-pulse text-emerald-400' : 'text-amber-400'}
          />
          <span className="font-mono text-xs font-black tracking-wider text-white sm:text-sm">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {pomodoroMode === 'focus' ? 'Fokus' : 'Tanaffus'}
          </span>
          <button
            onClick={handleTogglePomodoro}
            className={`rounded-lg border p-1.5 transition-all active:scale-95 ${
              isRunning
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
            title={isRunning ? 'Pauza' : 'Boshlash'}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
          </button>
          <button
            onClick={handleResetPomodoro}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Qayta o'rnatish"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Room Link Button */}
          <button
            onClick={() => {
              haptics.notification('success');
              navigator.clipboard.writeText(window.location.href);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="hidden items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 shadow-sm transition-all hover:bg-slate-700 active:scale-95 sm:flex"
            title="Xona havolasini nusxalash"
          >
            {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            <span>{copiedLink ? 'Nusxalandi!' : 'Havola'}</span>
          </button>

          {/* Desktop Whiteboard Panel Toggle Button */}
          <button
            onClick={() => setShowCollabPanel(!showCollabPanel)}
            className={`hidden items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 md:flex ${
              showCollabPanel
                ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={showCollabPanel ? 'Oq doskani yashirish' : "Oq doskani ko'rsatish"}
          >
            <PenTool size={16} />
            <span>{showCollabPanel ? 'Oq doskani yashirish' : 'Oq doska (Whiteboard)'}</span>
          </button>

          {/* Mobile Switch View Button */}
          <div className="border-slate-750 flex rounded-xl border bg-slate-800 p-1 md:hidden">
            <button
              onClick={() => setMobileView('video')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${mobileView === 'video' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
            >
              Video
            </button>
            <button
              onClick={() => setMobileView('collab')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${mobileView === 'collab' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
            >
              Oq doska
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={() => navigate('/jlpt')}
            className="rounded-xl border-none bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
          >
            <VideoOff size={18} className="mr-2" /> Chiqish
          </Button>
        </div>
      </header>

      {/* Split Screen Layout */}
      <div className="flex min-h-[500px] flex-1 flex-col gap-6 md:flex-row">
        {/* Left Side: Custom WebRTC Video Grid Container */}
        <div
          className={`relative flex w-full flex-1 flex-col space-y-4 overflow-hidden rounded-3xl border border-slate-800 bg-[#0f172a] p-4 shadow-2xl transition-all duration-300 ${mobileView === 'video' ? 'block' : 'hidden md:block'}`}
        >
          {!joinedCall ? (
            /* Pre-join / Preview Screen */
            <div className="relative flex flex-1 flex-col items-center justify-center p-4">
              {/* Preview Video Box */}
              <div className="relative flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300 hover:border-slate-700">
                {videoEnabled && localStream ? (
                  <video
                    ref={(ref) => {
                      if (ref) ref.srcObject = localStream;
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full -scale-x-100 transform rounded-2xl object-cover transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 transition-all duration-300">
                    <div className="bg-slate-850 mb-2 rounded-full p-4">
                      <VideoOff size={32} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Kamera o'chiq
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                  Kamera ko'rinishi (Preview)
                </div>
              </div>

              {/* Join Action Details */}
              <div className="hover:border-slate-850 mt-6 w-full max-w-md space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 text-center shadow-xl transition-all duration-300">
                <h3 className="text-lg font-bold tracking-tight text-white">Dars Xonasi Tayyor</h3>
                <p className="text-sm text-slate-400">
                  Guruhdoshlaringiz bilan real-vaqt rejimida video muloqot va hamkorlikni boshlash
                  uchun qo'shiling.
                </p>

                <button
                  onClick={() => setJoinedCall(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98]"
                >
                  <Video size={18} /> Darsni boshlash
                </button>
              </div>
            </div>
          ) : (
            /* Videos Grid (Active Call) - Auto-scales to fill available width */
            <div className="relative flex h-full w-full flex-1 flex-col items-center justify-center">
              <div
                className={`grid h-full min-h-0 w-full auto-rows-fr items-center justify-center gap-4 overflow-y-auto p-1 ${
                  Object.keys(remoteStreams).length === 0
                    ? 'mx-auto max-w-4xl grid-cols-1'
                    : Object.keys(remoteStreams).length === 1
                      ? 'mx-auto max-w-5xl grid-cols-1 sm:grid-cols-2'
                      : 'mx-auto max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {/* Local Video */}
                <div className="relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 hover:border-slate-700/80 hover:shadow-xl hover:shadow-slate-950/50">
                  {videoEnabled && localStream ? (
                    <video
                      ref={(ref) => {
                        if (ref) ref.srcObject = localStream;
                      }}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full rounded-2xl transition-all duration-500 ${isScreenSharing ? 'bg-slate-950 object-contain' : '-scale-x-100 transform object-cover'}`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 duration-300 animate-in fade-in">
                      <div className="mb-2 rounded-full bg-slate-800/60 p-4">
                        <VideoOff size={32} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Kamera o'chiq
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Men ({userProfile?.name || 'Talaba'}){' '}
                    {isScreenSharing && '(Ekran ulashilmoqda)'}
                  </div>
                </div>

                {/* Remote Videos */}
                {Object.entries(remoteStreams).map(([peerId, stream]) => {
                  const peerName = peersInfo[peerId] || 'Talaba';
                  return (
                    <div
                      key={peerId}
                      className="relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95 hover:border-slate-700/80 hover:shadow-xl hover:shadow-slate-950/50"
                    >
                      <video
                        ref={(ref) => {
                          if (ref) ref.srcObject = stream;
                        }}
                        autoPlay
                        playsInline
                        className="h-full w-full rounded-2xl object-cover transition-all duration-500"
                      />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        {peerName}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Media Controls Glassmorphism Floating Toolbar */}
          <div className="flex items-center justify-center gap-3 self-center rounded-2xl border border-slate-700/60 bg-slate-900/90 px-5 py-2.5 shadow-2xl backdrop-blur-xl">
            <button
              onClick={toggleAudio}
              className={`flex items-center justify-center rounded-xl border p-3 transition-all active:scale-95 ${
                audioEnabled
                  ? 'hover:bg-slate-750 border-slate-700 bg-slate-800 text-slate-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
              title={audioEnabled ? "Mikrofonni o'chirish" : 'Mikrofonni yoqish'}
            >
              {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`flex items-center justify-center rounded-xl border p-3 transition-all active:scale-95 ${
                videoEnabled
                  ? 'hover:bg-slate-750 border-slate-700 bg-slate-800 text-slate-200'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
              title={videoEnabled ? "Kamerani o'chirish" : 'Kamerani yoqish'}
            >
              {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            {joinedCall && (
              <>
                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  className={`flex items-center justify-center rounded-xl border p-3 transition-all active:scale-95 ${
                    isScreenSharing
                      ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'hover:bg-slate-750 border-slate-700 bg-slate-800 text-slate-200'
                  }`}
                  title={isScreenSharing ? "Ekranni ulashishni to'xtatish" : 'Ekranni ulashish'}
                >
                  {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                </button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    stopScreenShare();
                    setJoinedCall(false);
                  }}
                  className="rounded-xl border-none bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white"
                >
                  Tark etish
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Collapsible Whiteboard Sidebar Panel */}
        {showCollabPanel && (
          <div className="relative flex w-full flex-col overflow-hidden rounded-3xl border border-slate-700/50 bg-[#1e293b] shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 md:w-[460px] lg:w-[540px]">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
                <PenTool size={18} className="text-indigo-400" />
                <span>Oq Doska (Whiteboard)</span>
              </div>
              <button
                onClick={() => setShowCollabPanel(false)}
                className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title="Yashirish"
              >
                <Minimize2 size={18} />
              </button>
            </div>

            {/* Whiteboard Content Area */}
            <div className="relative flex min-h-[380px] flex-1 touch-none flex-col overflow-hidden rounded-b-3xl border-t border-border bg-[#FAF8F5] p-4 dark:bg-[#151B22]">
              <React.Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-xs font-bold text-slate-500">
                    Oq doska yuklanmoqda...
                  </div>
                }
              >
                <RoomWhiteboard onMount={handleWhiteboardMount} />
              </React.Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyRoomPage;
