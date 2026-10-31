import React, { useState, useEffect, useRef, useMemo } from 'react';

export type OrbState = 'idle' | 'listening' | 'speaking';

export interface KaiwaOrbCharacterProps {
  /**
   * Current behavioral state of the orb character.
   * - 'idle': Resting, breathing gently (1.5% cycle), floating 2px, glancing around, blinking every 2-5s.
   * - 'listening': Scaled +8%, looking upward at user, brighter colors, attentive.
   * - 'speaking': Audio-reactive vertical stretch (+10%), horizontal squash (-5%),
   *               jumps up 10px on peak volume, accelerated swirl, pulsing glow.
   */
  state?: OrbState;

  /**
   * Normalized real-time audio volume from 0.0 (silence) to 1.0 (loudest).
   * Drives organic reactive motion in 'speaking' and 'listening' states.
   */
  audioVolume?: number;

  /**
   * Diameter of the orb in pixels. Default is 260.
   */
  size?: number;

  /**
   * Optional custom CSS class for outer container.
   */
  className?: string;

  /**
   * When true, clicking the orb cycles through states (idle -> listening -> speaking -> idle).
   */
  interactive?: boolean;

  /**
   * Callback fired when state changes via user interaction.
   */
  onStateChange?: (newState: OrbState) => void;

  /**
   * Accessibility label for screen readers.
   */
  ariaLabel?: string;
}

export const KaiwaOrbCharacter: React.FC<KaiwaOrbCharacterProps> = ({
  state = 'idle',
  audioVolume = 0,
  size = 260,
  className = '',
  interactive = false,
  onStateChange,
  ariaLabel,
}) => {
  // 1. Exponential Smoothing (lerp) for audioVolume to guarantee silky smooth physics
  const [smoothedVolume, setSmoothedVolume] = useState(0);
  const targetVolumeRef = useRef(audioVolume);
  targetVolumeRef.current = audioVolume;

  useEffect(() => {
    let animId: number;
    let current = 0;
    const tick = () => {
      const target = Math.max(0, Math.min(1, targetVolumeRef.current || 0));
      // Fast attack, smooth decay
      const factor = target > current ? 0.22 : 0.12;
      current += (target - current) * factor;
      if (Math.abs(current - target) < 0.002) current = target;
      setSmoothedVolume(current);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Randomized Blinking (every 2 to 5 seconds in all states)
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    let unblinkTimer: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const delay = 2000 + Math.random() * 3000; // 2000ms - 5000ms
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        unblinkTimer = setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 130);
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(unblinkTimer);
    };
  }, []);

  // 3. Proportions relative to size
  const dimensions = useMemo(() => {
    const eyeWidth = Math.max(10, Math.round(size * 0.072)); // ~18.7px at 260
    const eyeHeight = Math.max(22, Math.round(size * 0.16)); // ~41.6px at 260
    const eyeGap = Math.max(16, Math.round(size * 0.12)); // ~31.2px at 260
    const catchlightSize = Math.max(3, Math.round(eyeWidth * 0.32)); // ~6px at 260
    const shadowWidth = Math.round(size * 0.65);
    const shadowHeight = Math.max(12, Math.round(size * 0.11));

    return {
      eyeWidth,
      eyeHeight,
      eyeGap,
      catchlightSize,
      shadowWidth,
      shadowHeight,
    };
  }, [size]);

  // 4. Physical State Calculations
  // State: IDLE
  // - 1.5% scale breathing over 4s (handled via CSS animation)
  // - 2px vertical bob (handled via CSS animation)
  // State: LISTENING
  // - Scaled +8% (1.08)
  // - Micro-reaction with user audio
  // State: SPEAKING
  // - Stretch +10% height (scaleY: 1 + smoothedVolume * 0.10)
  // - Squash -5% width (scaleX: 1 - smoothedVolume * 0.05)
  // - Jump up 10px on peak volume (translateY: -smoothedVolume * 10px)

  let bodyTransform = '';
  let shadowTransform = '';
  let shadowOpacity = 0.55;

  if (state === 'listening') {
    const listenScale = 1.08 + smoothedVolume * 0.03;
    bodyTransform = `scale(${listenScale})`;
    shadowTransform = `scale(${1.06})`;
    shadowOpacity = 0.6;
  } else if (state === 'speaking') {
    const scaleX = 1 - smoothedVolume * 0.05;
    const scaleY = 1 + smoothedVolume * 0.1;
    const jumpY = -smoothedVolume * 10;
    bodyTransform = `translate3d(0, ${jumpY}px, 0) scale(${scaleX}, ${scaleY})`;
    // Shadow shrinks and softens when character jumps up
    const shadowScale = 1 - smoothedVolume * 0.15;
    shadowTransform = `scale(${shadowScale})`;
    shadowOpacity = 0.55 - smoothedVolume * 0.2;
  }

  // 5. Ambient Glow calculations
  const glowStyle = useMemo(() => {
    if (state === 'idle') {
      return {
        boxShadow:
          '0 0 45px rgba(110, 80, 220, 0.40), 0 0 90px rgba(226, 82, 63, 0.24), 0 0 130px rgba(232, 72, 106, 0.15)',
      };
    }
    if (state === 'listening') {
      return {
        boxShadow:
          '0 0 55px rgba(255, 77, 141, 0.55), 0 0 100px rgba(122, 77, 255, 0.38), 0 0 145px rgba(255, 90, 77, 0.25)',
      };
    }
    // Speaking: glow pulses strongly with voice
    const blur1 = 45 + smoothedVolume * 40;
    const blur2 = 85 + smoothedVolume * 65;
    const blur3 = 130 + smoothedVolume * 80;
    const alphaPink = 0.5 + smoothedVolume * 0.45;
    const alphaOrange = 0.35 + smoothedVolume * 0.45;
    return {
      boxShadow: `0 0 ${blur1}px rgba(240, 70, 120, ${alphaPink}), 0 0 ${blur2}px rgba(91, 75, 219, 0.45), 0 0 ${blur3}px rgba(255, 106, 77, ${alphaOrange})`,
    };
  }, [state, smoothedVolume]);

  // 6. Eye styling and transforms
  // Idle: gentle left-right drift
  // Listening: eyes look up towards user (-6px)
  // Speaking: slightly enlarged (+10%), blinks continue
  const eyeContainerTransform = useMemo(() => {
    if (state === 'listening') {
      return 'translate3d(0, -6px, 0)';
    }
    if (state === 'speaking') {
      const eyeScale = 1.08 + smoothedVolume * 0.04;
      return `scale(${eyeScale})`;
    }
    return ''; // Idle drift is handled via CSS animation
  }, [state, smoothedVolume]);

  const eyeScaleY = isBlinking ? 0.06 : 1;

  const handleOrbClick = () => {
    if (!interactive) return;
    const nextState: OrbState =
      state === 'idle' ? 'listening' : state === 'listening' ? 'speaking' : 'idle';
    if (onStateChange) {
      onStateChange(nextState);
    }
  };

  const getAccessibleStatus = () => {
    switch (state) {
      case 'listening':
        return 'AI tinglamoqda (Listening). Foydalanuvchi ovozini kutmoqda.';
      case 'speaking':
        return 'AI gapirmoqda (Speaking). Murabbiy javob bermoqda.';
      default:
        return 'AI kutish rejimida (Idle). Tayyor.';
    }
  };

  return (
    <div
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel || getAccessibleStatus()}
      onClick={handleOrbClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleOrbClick();
        }
      }}
      className={`relative inline-flex select-none flex-col items-center justify-center ${
        interactive
          ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d8d]'
          : ''
      } ${className}`}
      style={{
        width: size + 40,
        height: size + 60,
      }}
    >
      {/* SCOPED CSS ANIMATIONS */}
      <style>{`
        @keyframes kaiwa-orb-breathe {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.9925);
          }
          50% {
            transform: translate3d(0, -2px, 0) scale(1.0075);
          }
        }

        @keyframes kaiwa-shadow-breathe {
          0%, 100% {
            transform: scale(0.985);
            opacity: 0.52;
          }
          50% {
            transform: scale(1.015);
            opacity: 0.58;
          }
        }

        @keyframes kaiwa-eyes-drift {
          0%, 100% {
            transform: translate3d(-3px, 0, 0);
          }
          50% {
            transform: translate3d(3px, 0, 0);
          }
        }

        @keyframes kaiwa-swirl-slow {
          0% {
            transform: rotate(0deg) scale(1.05);
          }
          50% {
            transform: rotate(180deg) scale(1.15);
          }
          100% {
            transform: rotate(360deg) scale(1.05);
          }
        }

        @keyframes kaiwa-swirl-medium {
          0% {
            transform: rotate(0deg) scale(1.08);
          }
          50% {
            transform: rotate(180deg) scale(1.2);
          }
          100% {
            transform: rotate(360deg) scale(1.08);
          }
        }

        @keyframes kaiwa-swirl-fast {
          0% {
            transform: rotate(0deg) scale(1.12);
          }
          50% {
            transform: rotate(180deg) scale(1.25);
          }
          100% {
            transform: rotate(360deg) scale(1.12);
          }
        }

        .kaiwa-breathe-idle {
          animation: kaiwa-orb-breathe 4s ease-in-out infinite;
        }

        .kaiwa-shadow-idle {
          animation: kaiwa-shadow-breathe 4s ease-in-out infinite;
        }

        .kaiwa-eyes-idle {
          animation: kaiwa-eyes-drift 5s ease-in-out infinite;
        }
      `}</style>

      {/* MAIN ORB WRAPPER (Handles overall scaling, breathing, and jump) */}
      <div
        className={`relative transition-transform duration-300 ease-out ${
          state === 'idle' ? 'kaiwa-breathe-idle' : ''
        }`}
        style={{
          width: size,
          height: size,
          transform: bodyTransform || undefined,
        }}
      >
        {/* SPHERE BODY (Circular with overflow hidden) */}
        <div
          className="relative h-full w-full overflow-hidden rounded-full transition-all duration-700 ease-out"
          style={{
            ...glowStyle,
            // When in listening, colors become slightly more vibrant & bright
            filter: state === 'listening' ? 'saturate(1.2) brightness(1.08)' : 'none',
          }}
        >
          {/* 
            LAYER 1: IDLE GRADIENT LAYER
            Colors: Coral-red (#e2523f), Pink (#e8486a), Violet (#6e50dc), Warm peach (#ffa06e)
          */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: state === 'idle' ? 1 : 0,
            }}
          >
            <div
              className="absolute -inset-[35%] rounded-full blur-[32px]"
              style={{
                animation: 'kaiwa-swirl-slow 24s linear infinite',
                background: `
                  radial-gradient(circle at 25% 25%, #e2523f 0%, rgba(226, 82, 63, 0.4) 45%, transparent 70%),
                  radial-gradient(circle at 75% 28%, #e8486a 0%, rgba(232, 72, 106, 0.45) 50%, transparent 75%),
                  radial-gradient(circle at 30% 75%, #6e50dc 0%, rgba(110, 80, 220, 0.5) 50%, transparent 75%),
                  radial-gradient(circle at 72% 72%, #ffa06e 0%, rgba(255, 160, 110, 0.45) 45%, transparent 70%),
                  radial-gradient(circle at 50% 50%, #e8486a 0%, #6e50dc 60%, transparent 80%)
                `,
              }}
            />
          </div>

          {/* 
            LAYER 2: LISTENING GRADIENT LAYER
            Colors: Vibrant coral (#ff5a4d), Magenta (#ff4d8d), Bright violet (#7a4dff), Peach (#ffb36b)
          */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: state === 'listening' ? 1 : 0,
            }}
          >
            <div
              className="absolute -inset-[35%] rounded-full blur-[32px]"
              style={{
                animation: 'kaiwa-swirl-medium 14s linear infinite',
                background: `
                  radial-gradient(circle at 24% 24%, #ff5a4d 0%, rgba(255, 90, 77, 0.5) 45%, transparent 70%),
                  radial-gradient(circle at 76% 26%, #ff4d8d 0%, rgba(255, 77, 141, 0.55) 50%, transparent 75%),
                  radial-gradient(circle at 28% 76%, #7a4dff 0%, rgba(122, 77, 255, 0.55) 50%, transparent 75%),
                  radial-gradient(circle at 74% 74%, #ffb36b 0%, rgba(255, 179, 107, 0.5) 45%, transparent 70%),
                  radial-gradient(circle at 50% 50%, #ff4d8d 0%, #7a4dff 60%, transparent 80%)
                `,
              }}
            />
          </div>

          {/* 
            LAYER 3: SPEAKING GRADIENT LAYER
            Colors: Pink (#f04678) & Violet (#5b4bdb) primary, Deep orange (#ff6a4d) accent
          */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{
              opacity: state === 'speaking' ? 1 : 0,
            }}
          >
            <div
              className="absolute -inset-[35%] rounded-full blur-[30px]"
              style={{
                animation: `kaiwa-swirl-fast ${Math.max(2.8, 5.5 - smoothedVolume * 2)}s linear infinite`,
                background: `
                  radial-gradient(circle at 22% 28%, #f04678 0%, rgba(240, 70, 120, 0.6) 45%, transparent 72%),
                  radial-gradient(circle at 78% 25%, #5b4bdb 0%, rgba(91, 75, 219, 0.6) 50%, transparent 75%),
                  radial-gradient(circle at 35% 75%, #ff6a4d 0%, rgba(255, 106, 77, 0.65) 48%, transparent 72%),
                  radial-gradient(circle at 72% 75%, #f04678 0%, rgba(240, 70, 120, 0.5) 50%, transparent 75%),
                  radial-gradient(circle at 50% 50%, #5b4bdb 0%, #f04678 55%, transparent 85%)
                `,
              }}
            />
          </div>

          {/* 
            3D SPHERE SURFACE SHADING:
            1. Top-left subtle specular highlight (Tepa-chap burchakda yengil yaltiroq)
            2. Bottom-right subtle shadow (Past-o'ngda salgina soya)
            3. Edge softening / inner vignette
          */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 26% 24%, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0.16) 24%, rgba(255, 255, 255, 0) 56%),
                radial-gradient(circle at 76% 76%, rgba(10, 11, 31, 0.58) 0%, rgba(10, 11, 31, 0.24) 40%, transparent 68%)
              `,
              boxShadow: 'inset 0 0 20px rgba(10, 11, 31, 0.3)',
            }}
          />

          {/* 
            THE EYES:
            Two vertical capsule-shaped black ovals (#080812) with a small white highlight dot inside each.
            No mouth, no limbs, no face lines - just expressive capsule eyes!
          */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`flex items-center transition-all duration-300 ease-out ${
                state === 'idle' ? 'kaiwa-eyes-idle' : ''
              }`}
              style={{
                gap: `${dimensions.eyeGap}px`,
                transform: eyeContainerTransform || undefined,
                marginTop: `-${Math.round(size * 0.04)}px`, // Centered slightly above equator for lifelike charm
              }}
            >
              {/* Left Eye Capsule */}
              <div
                className="relative rounded-full bg-[#070814] shadow-sm transition-transform duration-100 ease-out"
                style={{
                  width: `${dimensions.eyeWidth}px`,
                  height: `${dimensions.eyeHeight}px`,
                  transform: `scaleY(${eyeScaleY})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* White Catchlight Dot */}
                <div
                  className="absolute rounded-full bg-white shadow-xs"
                  style={{
                    width: `${dimensions.catchlightSize}px`,
                    height: `${dimensions.catchlightSize}px`,
                    top: `${Math.round(dimensions.eyeHeight * 0.18)}px`,
                    right: `${Math.round(dimensions.eyeWidth * 0.18)}px`,
                    opacity: 0.95,
                  }}
                />
              </div>

              {/* Right Eye Capsule */}
              <div
                className="relative rounded-full bg-[#070814] shadow-sm transition-transform duration-100 ease-out"
                style={{
                  width: `${dimensions.eyeWidth}px`,
                  height: `${dimensions.eyeHeight}px`,
                  transform: `scaleY(${eyeScaleY})`,
                  transformOrigin: 'center center',
                }}
              >
                {/* White Catchlight Dot */}
                <div
                  className="absolute rounded-full bg-white shadow-xs"
                  style={{
                    width: `${dimensions.catchlightSize}px`,
                    height: `${dimensions.catchlightSize}px`,
                    top: `${Math.round(dimensions.eyeHeight * 0.18)}px`,
                    right: `${Math.round(dimensions.eyeWidth * 0.18)}px`,
                    opacity: 0.95,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        UNDERLYING SOFT DROP SHADOW (Pastida yumshoq soya)
        Responds to breathing in Idle, and scales/softens during Speaking jump
      */}
      <div
        className={`pointer-events-none transition-all duration-300 ease-out ${
          state === 'idle' ? 'kaiwa-shadow-idle' : ''
        }`}
        style={{
          width: `${dimensions.shadowWidth}px`,
          height: `${dimensions.shadowHeight}px`,
          marginTop: `${Math.round(size * 0.06)}px`,
          background:
            'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6) 0%, rgba(10, 11, 31, 0) 74%)',
          filter: 'blur(4px)',
          opacity: shadowOpacity,
          transform: shadowTransform || undefined,
        }}
      />
    </div>
  );
};

export default KaiwaOrbCharacter;
