import React from 'react';
import { Video, Youtube, ExternalLink, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

interface VideoPlayerProps {
  url?: string;
  videoType?: 'none' | 'youtube' | 'upload' | string;
  title?: string;
  className?: string;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
};

export default function VideoPlayer({ url, videoType = 'youtube', title = 'Lesson Tutorial Video', className = '' }: VideoPlayerProps) {
  if (!url || videoType === 'none') {
    return null;
  }

  const ytId = getYouTubeVideoId(url);
  const isYouTube = videoType === 'youtube' || Boolean(ytId);

  // Normalize relative backend video URLs (e.g. /uploads/videos/...)
  const resolvedUrl = url.startsWith('/uploads/') ? `${API_URL}${url}` : url;

  return (
    <div className={`video-player-container rounded-2xl overflow-hidden border-2 border-black dark:border-slate-800 bg-black/90 shadow-xl ${className}`}>
      {/* Top Header */}
      <div className="px-4 py-2 bg-slate-900 border-b border-black/20 dark:border-slate-800 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          {isYouTube ? (
            <span className="flex items-center gap-1.5 text-red-400 font-mono font-bold">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>YouTube Video</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-cyan-400 font-mono font-bold">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>Lesson Video Lecture</span>
            </span>
          )}
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-sans font-medium truncate max-w-xs">{title}</span>
        </div>

        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white transition flex items-center gap-1 font-mono text-[10px]"
          title="Open in new window"
        >
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Video Content */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {isYouTube && ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={resolvedUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-black"
          >
            Your browser does not support HTML5 video playback.
          </video>
        )}
      </div>
    </div>
  );
}
