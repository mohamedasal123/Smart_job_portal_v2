import { useEffect, useRef } from 'react';

/**
 * NetworkBackground — canvas-based animated particle network.
 *
 * Props (all optional):
 *  - color:         hex string   — particle/line color  (default '#3b82f6')
 *  - particleCount: number       — how many particles   (default 65)
 *  - maxDist:       number       — max px for drawing lines (default 130)
 *  - className:     string       — extra classes on canvas  (default '')
 */
export default function NetworkBackground({
  color = '#3b82f6',
  particleCount = 65,
  maxDist = 130,
  className = '',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // ── Parse hex color once ──────────────────────────────────────────────
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const rgba = (alpha) => `rgba(${r},${g},${b},${alpha})`;

    // ── Resize helper ─────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    // ── Build particle array ──────────────────────────────────────────────
    const rand = (min, max) => Math.random() * (max - min) + min;

    const particles = Array.from({ length: particleCount }, () => ({
      x:     rand(0, canvas.width),
      y:     rand(0, canvas.height),
      vx:    rand(-0.35, 0.35),
      vy:    rand(-0.35, 0.35),
      r:     rand(1.8, 3.2),
      phase: rand(0, Math.PI * 2), // per-particle pulse phase offset
    }));

    // ── Mouse tracking ────────────────────────────────────────────────────
    const mouse = { x: -9999, y: -9999 };
    const REPEL_RADIUS = 100;
    const MAX_SPEED    = 1.5;

    const onMouseMove = (e) => {
      const rect  = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId;
    let t = 0; // global time counter for pulse

    const draw = () => {
      t += 0.018;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & draw each particle
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distM = Math.hypot(dx, dy);
        if (distM < REPEL_RADIUS && distM > 0) {
          const force = (REPEL_RADIUS - distM) / REPEL_RADIUS * 0.6;
          p.vx += (dx / distM) * force;
          p.vy += (dy / distM) * force;
        }

        // Cap speed
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > MAX_SPEED) {
          p.vx = (p.vx / speed) * MAX_SPEED;
          p.vy = (p.vy / speed) * MAX_SPEED;
        }

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0)              { p.x = 0;              p.vx *= -1; }
        if (p.x > canvas.width)   { p.x = canvas.width;   p.vx *= -1; }
        if (p.y < 0)              { p.y = 0;              p.vy *= -1; }
        if (p.y > canvas.height)  { p.y = canvas.height;  p.vy *= -1; }

        // Pulse radius
        const pulse = p.r + Math.sin(t + p.phase) * 0.6;

        // Soft glow (outer, low alpha)
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = rgba(0.12);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
        ctx.fillStyle = rgba(0.85);
        ctx.fill();
      }

      // Draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = rgba(alpha);
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    // ── Resize observer ───────────────────────────────────────────────────
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    window.addEventListener('resize', resize);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, [color, particleCount, maxDist]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ pointerEvents: 'auto' }} // needs pointer events for mouse repulsion
    />
  );
}
