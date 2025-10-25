import { useEffect, useRef } from 'react';
import type Hls from 'hls.js';

let HlsModule: typeof Hls | null = null;
if (typeof window !== 'undefined') {
  import('hls.js').then(module => {
    HlsModule = module.default;
    console.log('HLS module loaded:', HlsModule);
  });
}

export const useHLSPlayer = (
  videoRef: React.RefObject<HTMLVideoElement>,
  url: string | null,
  onError?: (error: string) => void
) => {
  const hlsRef = useRef<Hls | null>(null);
  const playAttemptRef = useRef<number>(0);
  const isPlaylistRef = useRef<boolean>(false);

  useEffect(() => {
    if (!url || !videoRef.current || !HlsModule) return;

    const video = videoRef.current;
    isPlaylistRef.current = url.toLowerCase().includes('.m3u');

    const initializeHLS = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      if (HlsModule.isSupported()) {
        const hls = new HlsModule({
          enableWorker: false,
          maxBufferSize: 0,
          maxBufferLength: 30,
          liveSyncDuration: 3,
          liveMaxLatencyDuration: 6,
          liveDurationInfinity: true,
          highBufferWatchdogPeriod: 1,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 1000,
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(HlsModule.Events.ERROR, (_: any, data: any) => {
          console.error('HLS Error:', data);
          
          // 特殊处理播放列表错误
          if (isPlaylistRef.current && data.details === 'levelParsingError') {
            onError?.('播放列表格式错误，无法解析');
            return;
          }

          if (data.fatal) {
            if (data.type === HlsModule.ErrorTypes.NETWORK_ERROR) {
              console.warn('网络错误，尝试重新加载...');
              hls.startLoad();
            } else if (data.type === HlsModule.ErrorTypes.MEDIA_ERROR) {
              console.warn('媒体错误，尝试恢复...');
              hls.recoverMediaError();
            } else {
              onError?.('播放失败，请尝试其他频道');
            }
          }
        });

        hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
          attemptPlay(video);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          attemptPlay(video);
        });
      } else {
        onError?.('您的浏览器不支持播放此视频');
      }
    };

    const attemptPlay = (videoElement: HTMLVideoElement) => {
      playAttemptRef.current = 0;
      
      const playWithFallback = () => {
        videoElement.play()
          .then(() => {
            console.log('播放成功');
          })
          .catch(error => {
            console.error('播放失败:', error);
            playAttemptRef.current += 1;
            
            // 对于播放列表，增加重试延迟
            const delay = isPlaylistRef.current 
              ? Math.min(2000 * playAttemptRef.current, 6000) 
              : Math.min(1000 * playAttemptRef.current, 3000);
            
            if (playAttemptRef.current <= 3) {
              console.warn(`播放尝试 ${playAttemptRef.current}/3`);
              setTimeout(playWithFallback, delay);
            } else {
              console.error('多次播放尝试失败');
              onError?.('自动播放失败，请点击视频手动播放');
            }
          });
      };

      playWithFallback();
    };

    try {
      initializeHLS();
    } catch (error) {
      console.error('HLS initialization error:', error);
      onError?.('播放器初始化失败');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', () => {});
      }
    };
  }, [url, videoRef, onError]);

  return hlsRef;
};