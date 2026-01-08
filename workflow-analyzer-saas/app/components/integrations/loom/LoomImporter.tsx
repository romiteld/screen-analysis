'use client'

import { useState } from 'react'
import { Link, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { LoomVideoEmbed } from './LoomVideoEmbed'

interface LoomImporterProps {
  onImportComplete?: (videoUrl: string, metadata?: any) => void
  onError?: (error: string) => void
}

export function LoomImporter({ onImportComplete, onError }: LoomImporterProps) {
  const [loomUrl, setLoomUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [importedVideoData, setImportedVideoData] = useState<{ videoId: string; videoUrl: string } | null>(null)
  const [showDownloadInstructions, setShowDownloadInstructions] = useState(false)
  const [videoMetadata, setVideoMetadata] = useState<any>(null)

  const validateLoomUrl = (url: string): boolean => {
    // Loom URLs typically follow patterns like:
    // https://www.loom.com/share/[video-id]
    // https://loom.com/share/[video-id]
    const loomUrlPattern = /^https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/
    return loomUrlPattern.test(url)
  }

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  const handleImport = async () => {
    if (!loomUrl.trim()) {
      setError('Please enter a Loom URL')
      return
    }

    if (!validateLoomUrl(loomUrl)) {
      setError('Invalid Loom URL. Please enter a valid Loom share link.')
      return
    }

    const videoId = extractVideoId(loomUrl)
    if (!videoId) {
      setError('Could not extract video ID from URL')
      return
    }

    setImporting(true)
    setError(null)
    setSuccess(false)

    try {
      // First, try to get metadata using oEmbed
      const oembedResponse = await fetch('/api/integrations/loom/oembed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loomUrl: loomUrl.trim()
        })
      })

      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json()
        setVideoMetadata(oembedData.metadata)
      }

      // Call API to process Loom video
      const response = await fetch('/api/integrations/loom/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loomUrl: loomUrl.trim(),
          videoId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import Loom video')
      }

      setSuccess(true)
      setImportedVideoData({ videoId, videoUrl: loomUrl })
      if (onImportComplete) {
        onImportComplete(data.videoUrl, data.metadata)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed'
      setError(errorMessage)
      if (onError) onError(errorMessage)
    } finally {
      setImporting(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setLoomUrl(url)
    setError(null)
    setSuccess(false)

    // Validate URL as user types
    if (url && !validateLoomUrl(url)) {
      setValidating(true)
      setTimeout(() => {
        setValidating(false)
        if (url && !validateLoomUrl(url)) {
          setError('Please enter a valid Loom share URL')
        }
      }, 1500)
    }
  }

  return (
    <div className="w-full">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="bg-purple-100 rounded-full p-2 mr-3">
            <Link className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Import from Loom</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Paste your Loom video share link below. Make sure the video has download permissions enabled.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="loom-url" className="block text-sm font-medium text-gray-700 mb-1">
              Loom Video URL
            </label>
            <input
              id="loom-url"
              type="url"
              value={loomUrl}
              onChange={handleUrlChange}
              placeholder="https://www.loom.com/share/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={importing}
            />
            <p className="mt-1 text-xs text-gray-500">
              Example: https://www.loom.com/share/abc123def456
            </p>
          </div>

          {error && !validating && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <p className="ml-2 text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {success && importedVideoData && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex">
                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-green-800">
                      Video imported successfully!
                    </p>
                    {videoMetadata?.title && (
                      <p className="text-xs text-green-700 mt-1">
                        "{videoMetadata.title}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <LoomVideoEmbed
                videoId={importedVideoData.videoId}
                loomUrl={importedVideoData.videoUrl}
                onDownloadClick={() => setShowDownloadInstructions(true)}
              />

              {showDownloadInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    How to Download Your Loom Video
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Click "Open in Loom" above to open your video</li>
                    <li>Sign in to Loom if prompted</li>
                    <li>Click the "Share" button below the video</li>
                    <li>Click "Download" in the sharing options</li>
                    <li>Choose "MP4" format and click "Download"</li>
                    <li>Once downloaded, use the "Upload File" option to upload the video</li>
                  </ol>
                </div>
              )}
            </>
          )}

          <button
            onClick={handleImport}
            disabled={importing || !loomUrl || validating}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Import Video
              </>
            )}
          </button>
        </div>

        <div className="mt-6 p-4 bg-purple-100 rounded-md">
          <h4 className="text-sm font-medium text-purple-900 mb-2">Important Notes:</h4>
          <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
            <li>The video must have download permissions enabled in Loom</li>
            <li>You must be signed into Loom to download videos</li>
            <li>Videos over 20GB cannot be downloaded from Loom</li>
            <li>Make sure the video privacy is set to "Anyone with the link can view"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}