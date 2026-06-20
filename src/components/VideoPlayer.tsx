import React, { useEffect, useRef, useState } from 'react';

export function VideoPlayer({ src, className, onClick }: { src: string, className?: string, onClick?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    
    // Play video if already loaded and visible, but mostly let IntersectionObserver handle it
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [src]);

  if (!src) return null;
  const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');
  
  if (isYoutube) {
    const getYoutubeId = (url: string) => {
      const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    const id = getYoutubeId(src);
    if (id) {
      return (
        <div className={`relative ${className}`} onClick={onClick}>
          <iframe
            className="absolute inset-0 w-full h-full pointer-events-none"
            src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  }

  return (
    <video 
      ref={videoRef}
      key={src}
      src={src} 
      muted 
      loop 
      autoPlay
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      className={className} 
      onClick={onClick}
    />
  );
}
