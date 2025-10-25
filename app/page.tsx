'use client'

import { useState, useEffect } from 'react'
import VideoPlayer from '@/components/player/video-player'
import ChannelList from '@/components/player/channel-list'
import { parseM3U } from '@/utils/m3u-parser'
import { Channel } from '@/types'

export default function Home() {
  const [url, setUrl] = useState('')
  const [playUrl, setPlayUrl] = useState<string | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePlay = async () => {
    if (!url) return
    setLoading(true)
    
    try {
      const encoded = encodeURIComponent(url)
      const response = await fetch(`/api/proxy?url=${encoded}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }
      
      const contentType = response.headers.get('content-type') || ''
      
      // 如果是播放列表
      if (contentType.includes('mpegurl') || url.endsWith('.m3u') || url.endsWith('.m3u8')) {
        const text = await response.text()
        const parsedChannels = parseM3U(text)
        
        if (parsedChannels.length > 0) {
          setChannels(parsedChannels)
          setSelectedChannel(parsedChannels[0])
          setPlayUrl(parsedChannels[0].url)
          return
        }
      }
      
      // 单个视频流
      setPlayUrl(`/api/proxy?url=${encoded}`)
      setChannels([])
      setSelectedChannel(null)
    } catch (error) {
      console.error('Error loading content:', error)
      alert('加载内容失败，请检查URL是否正确')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel)
    const encoded = encodeURIComponent(channel.url)
    setPlayUrl(`/api/proxy?url=${encoded}`)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6 bg-gray-100">
      <h1 className="text-2xl font-bold">IPTV 播放器</h1>
      
      <div className="w-full max-w-xl space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="请输入 .m3u8 或 .m3u 播放列表地址"
            className="flex-1 p-2 border border-gray-300 rounded"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            onClick={handlePlay}
            className="px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? '加载中...' : '播放'}
          </button>
        </div>

        {channels.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <ChannelList 
              channels={channels} 
              selectedChannel={selectedChannel} 
              onSelect={handleSelectChannel}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
            />
          </div>
        )}
      </div>

      {playUrl && (
        <div className="w-full max-w-4xl mt-4">
          <VideoPlayer url={playUrl} />
        </div>
      )}
    </main>
  )
}
