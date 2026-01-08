'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { calculatePrice } from '@/lib/stripe/config'

interface VideoLengthPickerProps {
  onVideoSelect: (file: File, durationSeconds: number) => void
}

export function VideoLengthPicker({ onVideoSelect }: VideoLengthPickerProps) {
  const [duration, setDuration] = useState<number | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setFileName(file.name)

    // Create video element to get duration
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = function() {
      window.URL.revokeObjectURL(video.src)
      const seconds = Math.ceil(video.duration)
      setDuration(seconds)
      onVideoSelect(file, seconds)
    }

    video.onerror = function() {
      setError('Failed to read video file. Please ensure it\'s a valid video format.')
      setDuration(null)
    }

    video.src = URL.createObjectURL(file)
  }, [onVideoSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
  })

  const minutes = duration ? Math.ceil(duration / 60) : 0
  const price = duration ? calculatePrice(duration) : 0

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-600">Drop the video here...</p>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">MP4, MOV, AVI, WebM, MKV up to 2GB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {fileName && duration && (
        <div className="rounded-md bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900">Video Details</h3>
          <dl className="mt-2 text-sm text-gray-600 space-y-1">
            <div>
              <dt className="inline font-medium">File:</dt>
              <dd className="inline ml-1">{fileName}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Duration:</dt>
              <dd className="inline ml-1">{minutes} minute{minutes !== 1 ? 's' : ''}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Price:</dt>
              <dd className="inline ml-1">${(price / 100).toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}