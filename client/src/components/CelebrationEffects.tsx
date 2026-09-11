import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Heart, Flower2, Flame } from 'lucide-react';

export type CelebrationMode = 'all' | 'crackers' | 'flowers' | 'hearts';

interface CelebrationEffectsProps {
  initialMode?: CelebrationMode;
  showControls?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  gravity: number;
  decay: number;
  type: 'cracker' | 'sparkle';
}

interface FloatingItem {
  id: number;
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  kind: 'heart' | 'flower' | 'petal';
  color: string;
}

export const CelebrationEffects: React.FC<CelebrationEffectsProps> = ({
  initialMode = 'all',
  showControls = true,
}) => {
  const [mode, setMode] = useState<CelebrationMode>(initialMode);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingItemsRef = useRef<FloatingItem[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastCrackerTimeRef = useRef<number>(0);

  // Palettes
  const heartColors = ['#f43f5e', '#ec4899', '#fb7185', '#fda4af', '#e11d48', '#ff758f'];
  const flowerColors = ['#fbbf24', '#f59e0b', '#f472b6', '#c084fc', '#a78bfa', '#34d399', '#f87171'];
  const crackerColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#fbbf24', '#ffffff', '#06b6d4'];

  // Initialize floating items
  useEffect(() => {
    const items: FloatingItem[] = [];
    const count = 35;
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const isHeart = Math.random() > 0.5;
      items.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 18 + 12,
        speedY: -(Math.random() * 0.7 + 0.35),
        speedX: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.5,
        opacity: Math.random() * 0.5 + 0.3,
        kind: isHeart ? 'heart' : (Math.random() > 0.5 ? 'flower' : 'petal'),
        color: isHeart 
          ? heartColors[Math.floor(Math.random() * heartColors.length)]
          : flowerColors[Math.floor(Math.random() * flowerColors.length)],
      });
    }
    floatingItemsRef.current = items;
  }, []);

  // Firework / Cracker blast spawner
  const spawnCrackerBlast = (x?: number, y?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blastX = x ?? (Math.random() * (canvas.width * 0.8) + canvas.width * 0.1);
    const blastY = y ?? (Math.random() * (canvas.height * 0.45) + canvas.height * 0.1);
    const count = Math.floor(Math.random() * 30) + 45;
    const color = crackerColors[Math.floor(Math.random() * crackerColors.length)];
    const secondColor = crackerColors[Math.floor(Math.random() * crackerColors.length)];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 5 + 2.5;
      particlesRef.current.push({
        x: blastX,
        y: blastY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: Math.random() > 0.3 ? color : secondColor,
        size: Math.random() * 3.5 + 1.5,
        gravity: 0.06,
        decay: Math.random() * 0.015 + 0.012,
        type: 'cracker',
      });
    }

    // Add extra glowing sparkles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 0.5;
      particlesRef.current.push({
        x: blastX,
        y: blastY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: '#ffffff',
        size: Math.random() * 2 + 1,
        gravity: 0.02,
        decay: Math.random() * 0.02 + 0.015,
        type: 'sparkle',
      });
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Draw Heart Helper
    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number, rotation: number) => {
      c.save();
      c.translate(x, y);
      c.rotate((rotation * Math.PI) / 180);
      c.globalAlpha = opacity;
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 8;
      c.beginPath();
      const topCurveHeight = size * 0.3;
      c.moveTo(0, topCurveHeight);
      c.bezierCurveTo(
        -size / 2, -size / 2,
        -size, topCurveHeight / 3,
        0, size
      );
      c.bezierCurveTo(
        size, topCurveHeight / 3,
        size / 2, -size / 2,
        0, topCurveHeight
      );
      c.closePath();
      c.fill();
      c.restore();
    };

    // Draw Flower Helper
    const drawFlower = (c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number, rotation: number) => {
      c.save();
      c.translate(x, y);
      c.rotate((rotation * Math.PI) / 180);
      c.globalAlpha = opacity;
      c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 6;
      
      const petals = 5;
      for (let i = 0; i < petals; i++) {
        c.rotate((Math.PI * 2) / petals);
        c.beginPath();
        c.ellipse(0, size * 0.45, size * 0.22, size * 0.4, 0, 0, Math.PI * 2);
        c.fill();
      }
      
      c.fillStyle = '#fef08a';
      c.beginPath();
      c.arc(0, 0, size * 0.2, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // Draw Petal Helper
    const drawPetal = (c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, opacity: number, rotation: number) => {
      c.save();
      c.translate(x, y);
      c.rotate((rotation * Math.PI) / 180);
      c.globalAlpha = opacity;
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(0, 0, size * 0.28, size * 0.6, Math.PI / 4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    const allowCrackers = mode === 'all' || mode === 'crackers';
    const allowHearts = mode === 'all' || mode === 'hearts';
    const allowFlowers = mode === 'all' || mode === 'flowers';

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (allowCrackers) {
        if (timestamp - lastCrackerTimeRef.current > (mode === 'crackers' ? 1200 : 2200)) {
          spawnCrackerBlast();
          lastCrackerTimeRef.current = timestamp;
        }
      }

      // 1. Draw & update floating items (Hearts / Flowers)
      if (allowHearts || allowFlowers) {
        floatingItemsRef.current.forEach((item) => {
          if (item.kind === 'heart' && !allowHearts) return;
          if ((item.kind === 'flower' || item.kind === 'petal') && !allowFlowers) return;

          item.y += item.speedY;
          item.x += item.speedX + Math.sin(item.y * 0.015) * 0.3;
          item.rotation += item.rotationSpeed;

          if (item.y < -40) {
            item.y = canvas.height + 20;
            item.x = Math.random() * canvas.width;
          }
          if (item.x < -40) item.x = canvas.width + 20;
          if (item.x > canvas.width + 40) item.x = -20;

          if (item.kind === 'heart') {
            drawHeart(ctx, item.x, item.y, item.size, item.color, item.opacity, item.rotation);
          } else if (item.kind === 'flower') {
            drawFlower(ctx, item.x, item.y, item.size, item.color, item.opacity, item.rotation);
          } else {
            drawPetal(ctx, item.x, item.y, item.size, item.color, item.opacity, item.rotation);
          }
        });
      }

      // 2. Draw & update cracker blast particles
      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02);

        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.985;
          p.vy *= 0.985;
          p.alpha -= p.decay;

          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.type === 'cracker' ? 6 : 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Interactive on-click cracker bursts anywhere in background!
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      if (allowCrackers) {
        spawnCrackerBlast(clientX, clientY);
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mode]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {/* Background celebration canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Interactive Celebration Theme Selector Pill */}
      {showControls && (
        <div className="pointer-events-auto fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-md border border-amber-300 shadow-xl shadow-amber-950/10 transition-all sm:bottom-6">
          <button
            onClick={() => setMode('all')}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              mode === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="All Celebration Effects"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Magic</span>
          </button>

          <button
            onClick={() => {
              setMode('crackers');
              spawnCrackerBlast();
            }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              mode === 'crackers'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="Crackers & Fireworks"
          >
            <Flame className="w-3.5 h-3.5 text-amber-200" />
            <span>Crackers</span>
          </button>

          <button
            onClick={() => setMode('flowers')}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              mode === 'flowers'
                ? 'bg-pink-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="Blossoming Flowers"
          >
            <Flower2 className="w-3.5 h-3.5 text-pink-200" />
            <span>Flowers</span>
          </button>

          <button
            onClick={() => setMode('hearts')}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
              mode === 'hearts'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            title="Floating Hearts"
          >
            <Heart className="w-3.5 h-3.5 text-rose-200 fill-current" />
            <span>Hearts</span>
          </button>
        </div>
      )}
    </div>
  );
};
