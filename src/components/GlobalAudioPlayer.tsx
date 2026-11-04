import { useEffect, useRef } from 'react';
import { useFocusTimerContext } from '../context/FocusTimerContext';

const SOUNDS = [
  { id: 'none', label: 'Silent', url: '' },
  {
    id: 'lofi',
    label: 'Lofi Music',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'rain',
    label: 'Heavy Rain',
    url: 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg',
  },
  {
    id: 'forest',
    label: 'Forest',
    url: 'https://actions.google.com/sounds/v1/ambiences/forest_morning.ogg',
  },
  {
    id: 'cafe',
    label: 'Cafe',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
  },
];

const GlobalAudioPlayer = () => {
  const { focusState } = useFocusTimerContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const soundUrl = SOUNDS.find((s) => s.id === focusState.bgSound)?.url;
    if (soundUrl && focusState.isActive && !focusState.isMuted) {
      if (audioRef.current.src !== soundUrl) {
        audioRef.current.src = soundUrl;
      }
      // Silent fail if browser blocks autoplay
      audioRef.current.play().catch((e) => console.warn('Audio play blocked by browser:', e));
    } else {
      audioRef.current.pause();
    }
  }, [focusState.bgSound, focusState.isActive, focusState.isMuted]);

  useEffect(() => {
    if (focusState.isSessionCompleted && !focusState.isMuted) {
      const ringtone = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3');
      ringtone.play().catch((e) => console.warn('Ringtone play blocked by browser:', e));

      // Auto stop ringtone after 5 seconds to avoid annoyance
      const timer = setTimeout(() => {
        ringtone.pause();
      }, 5000);

      return () => {
        clearTimeout(timer);
        ringtone.pause();
      };
    }
  }, [focusState.isSessionCompleted, focusState.isMuted]);

  return <audio ref={audioRef} loop />;
};

export default GlobalAudioPlayer;
