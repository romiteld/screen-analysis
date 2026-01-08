'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Download, Info } from 'lucide-react'

interface LoomVideoEmbedProps {
  videoId: string
  loomUrl: string
  onDownloadClick?: () => void
}

export function LoomVideoEmbed({ videoId, loomUrl, onDownloadClick }: LoomVideoEmbedProps) {
  const [showEmbed, setShowEmbed] = useState(false)
  const embedUrl = `https://www.loom.com/embed/${videoId}`

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Loom Video Preview
        </h4>
        
        {!showEmbed ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Click below to preview your Loom video before downloading.
            </p>
            <button
              onClick={() => setShowEmbed(true)}
              className="w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium"
            >
              Show Video Preview
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                frameBorder="0"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-md"
                title="Loom Video Preview"
              />
            </div>
            
            <div className="flex gap-2">
              <a
                href={loomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center py-2 px-4 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Loom
              </a>
              <button
                onClick={onDownloadClick}
                className="flex-1 flex items-center justify-center py-2 px-4 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Instructions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}