import { useState, useRef, useEffect } from 'react';

/**
 * LazyImage — blur-up fade-in technique.
 * Images load blurred and fade to sharp when fully loaded.
 * Uses IntersectionObserver for true lazy loading.
 *
 * Props: same as <img> plus:
 *  - wrapperClassName: classes on wrapper div
 *  - fallback: element shown while loading (default: skeleton)
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  style,
  fallback,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${wrapperClassName}`}
      style={style}
    >
      {/* Skeleton placeholder */}
      {!loaded && (
        <div
          className="absolute inset-0 skeleton-premium rounded-inherit"
          aria-hidden="true"
        />
      )}

      {inView && (
        <img
          src={src}
          alt={alt}
          className={`img-blur-up ${loaded ? 'loaded' : ''} ${className}`}
          onLoad={() => setLoaded(true)}
          {...rest}
        />
      )}
    </div>
  );
}
