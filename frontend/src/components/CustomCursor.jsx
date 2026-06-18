import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * CustomCursor — premium smooth-tracking cursor for desktop only.
 * Features: magnetic on buttons, scale on hover, morph on links,
 * glow effect, 60fps interpolation via RAF.
 */
export default function CustomCursor() {
  const reduce = useReducedMotion();
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState('default'); // default | hover-button | hover-link | hover-input | hover-image

  // Only show on non-touch desktop
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    if (reduce || isTouchDevice) return;

    document.documentElement.classList.add('custom-cursor-active');

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!visible) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const onMouseOver = (e) => {
      const el = e.target.closest('button, [role="button"], .btn, .btn-premium');
      const link = e.target.closest('a');
      const input = e.target.closest('input, textarea, select');
      const img = e.target.closest('img, figure');

      if (el) setState('hover-button');
      else if (input) setState('hover-input');
      else if (img) setState('hover-image');
      else if (link) setState('hover-link');
      else setState('default');
    };

    const animate = () => {
      // Smooth interpolation: dot follows faster, ring follows slower
      dot.current.x += (mouse.current.x - dot.current.x) * 0.5;
      dot.current.y += (mouse.current.y - dot.current.y) * 0.5;
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dot.current.x}px, ${dot.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.removeEventListener('mouseover', onMouseOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduce, isTouchDevice, visible]);

  if (reduce || isTouchDevice) return null;

  const isHoverButton = state === 'hover-button';
  const isHoverInput = state === 'hover-input';
  const isHoverImage = state === 'hover-image';
  const isHoverLink = state === 'hover-link';

  // Dot styles
  const dotSize = isHoverButton ? 8 : isHoverInput ? 2 : 6;
  const dotOpacity = visible ? 1 : 0;

  // Ring styles
  const ringSize = isHoverButton ? 42 : isHoverInput ? 28 : isHoverImage ? 56 : isHoverLink ? 36 : 28;
  const ringOpacity = visible ? (isHoverInput ? 0.4 : 0.6) : 0;
  const ringBorderWidth = isHoverButton ? 2 : 1.5;
  const ringColor = isHoverButton
    ? 'rgb(37, 99, 235)'
    : isHoverLink
    ? 'rgb(20, 184, 166)'
    : 'rgb(37, 99, 235)';

  const glowVisible = isHoverButton || isHoverLink;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    >
      {/* Trailing ring */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          border: `${ringBorderWidth}px solid ${ringColor}`,
          opacity: ringOpacity,
          transition: 'width 0.25s ease, height 0.25s ease, opacity 0.2s ease, border-color 0.2s ease',
          willChange: 'transform',
          boxShadow: glowVisible ? `0 0 12px ${ringColor}60` : 'none',
        }}
      />

      {/* Center dot */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: 'rgb(37, 99, 235)',
          opacity: dotOpacity,
          transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
