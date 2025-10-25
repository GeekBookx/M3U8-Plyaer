import { Channel } from '@/types';

export const parseM3U = (content: string): Channel[] => {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};

  lines.forEach(line => {
    line = line.trim();
    
    // 处理 #EXTINF 元数据
    if (line.startsWith('#EXTINF:')) {
      // 尝试解析各种格式的元数据
      const durationMatch = line.match(/-?\d+/);
      const duration = durationMatch ? parseInt(durationMatch[0]) : -1;
      
      const titleMatch = line.match(/,(.*)$/);
      const title = titleMatch ? titleMatch[1].trim() : '未知频道';
      
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const group = groupMatch ? groupMatch[1].trim() : '未分类';
      
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const logo = logoMatch ? logoMatch[1].trim() : '';
      
      currentChannel = {
        title,
        group,
        duration,
        logo,
        url: ''
      };
    }
    // 处理实际URL
    else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
      if (currentChannel.title) {
        currentChannel.url = line;
        channels.push(currentChannel as Channel);
        currentChannel = {};
      }
    }
    // 处理空行或注释
    else if (!line || line.startsWith('#')) {
      // 跳过
    }
  });

  return channels;
};

export const cn = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};