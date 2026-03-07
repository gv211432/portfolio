"use client";
import { useEffect, useRef, useState } from "react";

interface LazyVideoProps {
  webm: string;
  mp4: string;
  poster: string;
  className?: string;
}

/**
 * LazyVideo — defers video source injection until the element enters the viewport.
 *
 * Why not `preload="none"` + `autoPlay`?
 * The browser needs buffered data to start playback. `preload="none"` prevents
 * that, so autoplay silently fails in most browsers. This component solves it by
 * keeping the <video> source-free on mount (poster shows instantly), then injecting
 * sources + calling load() + play() exactly when the element becomes visible.
 */
export default function LazyVideo({ webm, mp4, poster, className }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          const webmSource = document.createElement("source");
          webmSource.src = webm;
          webmSource.type = "video/webm";

          const mp4Source = document.createElement("source");
          mp4Source.src = mp4;
          mp4Source.type = "video/mp4";

          // WebM first — smaller, better codec; MP4 as fallback
          video.appendChild(webmSource);
          video.appendChild(mp4Source);
          video.load();
          video.play().catch(() => {
            // Autoplay blocked (e.g. power-save mode) — poster stays visible, no crash
          });

          setLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01 } // trigger as soon as even 1% is visible
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [loaded, webm, mp4]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      poster={poster}
      className={className}
    />
  );
}
