import React, { useRef, useEffect, useState } from 'react';
import { useHLSPlayer } from '@/hooks/use-hls-player';
import type { VideoPlayerProps } from '@/types';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handlePlayerError = (errorMsg: string) => {
    setError(errorMsg);
    onError?.(errorMsg);
  };

  useHLSPlayer(videoRef, url, handlePlayerError);

  useEffect(() => {
    setError(null); // 重置错误状态
    const videoElement = videoRef.current;
    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.src = '';
        videoElement.load();
      }
    };
  }, [url]);

  if (!url) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">请选择一个频道开始播放</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white z-10 p-4">
          <p className="text-red-500 font-bold text-lg mb-2">播放错误</p>
          <p className="text-center">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => setError(null)}
          >
            重试
          </button>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        autoPlay
        muted
        style={{ backgroundColor: 'black' }}
      />
    </div>
  );
};

export default VideoPlayer;