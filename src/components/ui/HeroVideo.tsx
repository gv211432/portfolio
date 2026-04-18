"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

const HLS_SRC = "/videos/hero/hls/output.m3u8";
const FALLBACK_SRC = "/videos/hero/video.web.mp4";
const POSTER = "/videos/hero/video.poster.jpg";

export default function HeroVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 0.8;

    if (Hls.isSupported()) {
      const hls = new Hls({
        // Load only 1 segment ahead to start playing immediately
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        startLevel: -1,
        // Assume decent bandwidth so first segment loads without ABR delay
        abrEwmaDefaultEstimate: 2_000_000,
      });

      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      return () => hls.destroy();
    }

    // Safari: native HLS support
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
      video.play().catch(() => {});
      return;
    }

    // Fallback: plain mp4
    video.src = FALLBACK_SRC;
    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      poster={POSTER}
      className={className}
    />
  );
}
