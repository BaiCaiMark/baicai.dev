'use client'

import { useMemo, useState } from 'react'

const supportedExtensions = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv']

function getUrlInfo(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return { isValid: false, extension: '', fileName: '', cleanUrl: '' }
  }

  try {
    const url = new URL(trimmed)
    const pathname = decodeURIComponent(url.pathname)
    const fileName = pathname.split('/').filter(Boolean).pop() || 'video'
    const lowerFileName = fileName.toLowerCase()
    const extension = supportedExtensions.find((item) => lowerFileName.endsWith(item)) || ''

    return {
      isValid: url.protocol === 'https:' || url.protocol === 'http:',
      extension,
      fileName,
      cleanUrl: url.toString(),
    }
  } catch {
    return { isValid: false, extension: '', fileName: '', cleanUrl: '' }
  }
}

export default function DirectVideoDownloaderPage() {
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [copied, setCopied] = useState(false)

  const info = useMemo(() => getUrlInfo(url), [url])
  const downloadName = fileName.trim() || info.fileName || 'video'
  const canUse = info.isValid && Boolean(info.cleanUrl)
  const looksLikeVideo = Boolean(info.extension)

  async function copyUrl() {
    if (!info.cleanUrl) return
    await navigator.clipboard.writeText(info.cleanUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Tools / Direct Video Downloader</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">Direct video downloader.</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          Paste a direct video file URL, then open or download it from the browser. This is for files
          you have permission to access, such as direct .mp4, .mov, .webm, or other video file links.
        </p>
      </div>

      <div className="mt-10 rounded-md border border-gray-200 bg-gray-50 p-5 sm:p-6">
        <label className="block">
          <span className="text-sm font-semibold text-gray-950">Direct video URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/video.mp4"
            className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-gray-950">Optional file name</span>
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="my-video.mp4"
            className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
          />
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</p>
            <p className="mt-2 text-sm font-semibold text-gray-950">
              {!url.trim() ? 'Waiting for link' : canUse ? 'Link ready' : 'Invalid URL'}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">File type</p>
            <p className="mt-2 text-sm font-semibold text-gray-950">{info.extension || 'Unknown'}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Download name</p>
            <p className="mt-2 break-all text-sm font-semibold text-gray-950">{downloadName}</p>
          </div>
        </div>

        {canUse && !looksLikeVideo ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            This URL does not end with a common video extension. It may still work, but some websites
            use pages or protected links instead of direct files.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={canUse ? info.cleanUrl : undefined}
            download={downloadName}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              canUse ? 'bg-gray-950 text-white hover:bg-gray-800' : 'pointer-events-none bg-gray-300 text-white'
            }`}
          >
            Download
          </a>
          <a
            href={canUse ? info.cleanUrl : undefined}
            target="_blank"
            rel="noreferrer"
            className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
              canUse
                ? 'border-gray-300 text-gray-900 hover:border-gray-900'
                : 'pointer-events-none border-gray-200 text-gray-400'
            }`}
          >
            Open link
          </a>
          <button
            type="button"
            onClick={copyUrl}
            disabled={!canUse}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Copy URL
          </button>
        </div>

        {copied ? <p className="mt-3 text-sm font-medium text-gray-950">URL copied</p> : null}
      </div>

      <div className="mt-8 rounded-md border border-gray-200 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-950">What works best</h2>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-gray-600 sm:grid-cols-2">
          <p>Use direct file links that end in .mp4, .mov, .webm, .m4v, .avi, or .mkv.</p>
          <p>Some sites block browser downloads or require login. In that case, use the site owner&apos;s official download option.</p>
        </div>
      </div>
    </section>
  )
}
