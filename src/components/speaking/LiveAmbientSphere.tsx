import React, { useEffect, useRef } from 'react';

interface LiveAmbientSphereProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  volumeLevel?: number; // 0.0 to 1.0
  size?: number;
}

export const LiveAmbientSphere: React.FC<LiveAmbientSphereProps> = ({
  status,
  volumeLevel = 0,
  size = 240,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.05;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;

      // Status color palettes
      let primaryColor = '100, 116, 139'; // Slate for idle
      let secondaryColor = '71, 85, 105';

      if (status === 'listening') {
        primaryColor = '16, 185, 129'; // Emerald
        secondaryColor = '6, 182, 212'; // Cyan
      } else if (status === 'thinking') {
        primaryColor = '99, 102, 241'; // Indigo
        secondaryColor = '168, 85, 247'; // Purple
      } else if (status === 'speaking') {
        primaryColor = '244, 63, 94'; // Rose
        secondaryColor = '245, 158, 11'; // Amber
      }

      // Dynamic radius based on volume level
      const baseRadius = size * 0.28;
      const pulse = Math.sin(phase) * 6;
      const volExpand = volumeLevel * (size * 0.15);
      const currentRadius = baseRadius + pulse + volExpand;

      // Outer Glow Layer
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        currentRadius * 0.5,
        centerX,
        centerY,
        currentRadius * 1.6,
      );
      outerGlow.addColorStop(0, `rgba(${primaryColor}, 0.6)`);
      outerGlow.addColorStop(0.5, `rgba(${secondaryColor}, 0.3)`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // Core Pulse Sphere
      const coreGradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.3,
        centerY - currentRadius * 0.3,
        currentRadius * 0.1,
        centerX,
        centerY,
        currentRadius,
      );
      coreGradient.addColorStop(0, `rgb(255, 255, 255)`);
      coreGradient.addColorStop(0.4, `rgb(${primaryColor})`);
      coreGradient.addColorStop(1, `rgb(${secondaryColor})`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Wave rings
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const ringRadius = currentRadius + ((phase * 15 + i * 25) % (size * 0.2));
        const opacity = 1 - (ringRadius - currentRadius) / (size * 0.2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${primaryColor}, ${Math.max(0, opacity * 0.5)})`;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [status, volumeLevel, size]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="drop-shadow-2xl transition-all duration-300"
      />
      <div className="pointer-events-none absolute text-center">
        <span className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-black uppercase tracking-widest text-foreground shadow-md backdrop-blur-md">
          {status === 'idle' && 'Tayyor'}
          {status === 'listening' && '🎙️ Eshitilmoqda...'}
          {status === 'thinking' && '🧠 AI Oʻylamoqda...'}
          {status === 'speaking' && '🔊 AI Gapirmoqda...'}
        </span>
      </div>
    </div>
  );
};
