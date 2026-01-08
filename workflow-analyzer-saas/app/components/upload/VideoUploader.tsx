'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileVideo, X, AlertCircle } from 'lucide-react'

interface VideoUploaderProps {
  uploadId: string
  onUploadComplete?: (url: string) => void
  onError?: (error: string) => void
}

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

export function VideoUploader({ uploadId, onUploadComplete, onError }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, MOV, WebM, or AVI files.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 500MB limit.'
    }
    return null
  }

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      if (onError) onError(validationError)
      return
    }
    setFile(file)
    setError(null)
  }, [onError])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [handleFile])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploadId', uploadId)

    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch (e) {
              reject(new Error('Invalid response format'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || 'Upload failed'))
            } catch (e) {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })

      const data = await uploadPromise
      
      if (onUploadComplete) {
        onUploadComplete(data.url)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      if (onError) onError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleChange}
            className="hidden"
            id="video-upload"
          />
          
          <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
          
          <p className="mt-2 text-sm text-gray-600">
            <label
              htmlFor="video-upload"
              className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              Click to upload
            </label>
            {' '}or drag and drop
          </p>
          
          <p className="text-xs text-gray-500 mt-1">
            MP4, MOV, WebM, or AVI up to 500MB
          </p>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileVideo className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {!uploading && (
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {!uploading && (
            <button
              onClick={handleUpload}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}