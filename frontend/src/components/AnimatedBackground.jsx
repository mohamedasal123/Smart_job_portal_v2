import { useReducedMotion } from 'framer-motion';

/**
 * AnimatedBackground — subtle floating gradient blobs that create depth.
 * GPU-accelerated via transform. Stays behind all content (z-index: 0).
 * Adapts to dark/light mode automatically via CSS.
 */
export default function AnimatedBackground() {
  const reduce = useReducedMotion();

  // Don't render at all if user prefers reduced motion
  if (reduce) return null;

  const blobs = [
    {
      color: 'rgb(37, 99, 235)',
      size: 600,
      top: '-10%',
      left: '-5%',
      duration: '18s',
      delay: '0s',
    },
    {
      color: 'rgb(20, 184, 166)',
      size: 500,
      top: '40%',
      right: '-8%',
      duration: '22s',
      delay: '-7s',
    },
    {
      color: 'rgb(37, 99, 235)',
      size: 400,
      bottom: '-8%',
      left: '30%',
      duration: '26s',
      delay: '-14s',
    },
    {
      color: 'rgb(20, 184, 166)',
      size: 350,
      top: '15%',
      left: '55%',
      duration: '20s',
      delay: '-4s',
    },
  ];

  return (
    <div className="animated-mesh" aria-hidden="true">
      {blobs.map((blob, i) => (
        <div
          key={i}
          className="animated-mesh-blob"
          style={{
            width: blob.size,
            height: blob.size,
            background: blob.color,
            top: blob.top,
            left: blob.left,
            right: blob.right,
            bottom: blob.bottom,
            animationDuration: blob.duration,
            animationDelay: blob.delay,
          }}
        />
      ))}
    </div>
  );
}
