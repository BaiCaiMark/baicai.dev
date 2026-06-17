'use client'

import { useEffect, useMemo, useState } from 'react'

type SavedVideo = {
  id: string
  url: string
  title: string
  savedAt: string
}

const storageKey = 'baicai-youtube-link-helper'

function extractYouTubeId(input: string) {
  const value = input.trim()
  if (!value) return ''

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] || ''
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v') || ''
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/').filter(Boolean)[1] || ''
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/').filter(Boolean)[1] || ''
      if (url.pathname.startsWith('/live/')) return url.pathname.split('/').filter(Boolean)[1] || ''
    }
  } catch {
    const match = value.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{6,})/)
    return match?.[1] || ''
  }

  return ''
}

function normalizeYouTubeUrl(id: string) {
  return id ? `https://www.youtube.com/watch?v=${id}` : ''
}

export default function YouTubeLinkHelperPage() {
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([])
  const [copied, setCopied] = useState('')

  const videoId = useMemo(() => extractYouTubeId(input), [input])
  const normalizedUrl = useMemo(() => normalizeYouTubeUrl(videoId), [videoId])
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
  const embedCode = videoId
    ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allowfullscreen></iframe>`
    : ''

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      setSavedVideos(raw ? JSON.parse(raw) : [])
    } catch {
      setSavedVideos([])
    }
  }, [])

  function persistVideos(nextVideos: SavedVideo[]) {
    setSavedVideos(nextVideos)
    window.localStorage.setItem(storageKey, JSON.stringify(nextVideos))
  }

  async function copyText(label: string, value: string) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1600)
  }

  function saveVideo() {
    if (!videoId || !normalizedUrl) return

    const nextVideo: SavedVideo = {
      id: videoId,
      url: normalizedUrl,
      title: title.trim() || `YouTube video ${videoId}`,
      savedAt: new Date().toISOString(),
    }

    persistVideos([nextVideo, ...savedVideos.filter((video) => video.id !== videoId)].slice(0, 20))
    setTitle('')
  }

  function removeVideo(id: string) {
    persistVideos(savedVideos.filter((video) => video.id !== id))
  }

  function clearAll() {
    persistVideos([])
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Tools / YouTube Link Helper</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">YouTube link helper.</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          Paste a YouTube link to extract the video ID, preview the video, copy useful links,
          and keep a short local list for later. Use official YouTube options for any downloads.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-semibold text-gray-950">YouTube link</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-gray-950">Optional note</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: countertop edge detail"
              className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveVideo}
              disabled={!videoId}
              className="rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Save link
            </button>
            <button
              type="button"
              onClick={() => copyText('URL copied', normalizedUrl)}
              disabled={!normalizedUrl}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={() => copyText('ID copied', videoId)}
              disabled={!videoId}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Copy ID
            </button>
          </div>

          {copied ? <p className="mt-3 text-sm font-medium text-gray-950">{copied}</p> : null}
        </div>

        <div className="rounded-md border border-gray-200 p-5 sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Preview</p>
          {videoId ? (
            <div className="mt-4">
              <img src={thumbnailUrl} alt="YouTube thumbnail" className="aspect-video w-full rounded-md bg-gray-100 object-cover" />
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-gray-950">Video ID</dt>
                  <dd className="mt-1 break-all text-gray-600">{videoId}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-950">Clean URL</dt>
                  <dd className="mt-1 break-all text-gray-600">{normalizedUrl}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={normalizedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Open YouTube
                </a>
                <button
                  type="button"
                  onClick={() => copyText('Embed copied', embedCode)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
                >
                  Copy embed
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-gray-300 p-6 text-sm leading-6 text-gray-600">
              Paste a normal YouTube, Shorts, live, embed, or youtu.be link to see the preview here.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-md border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Saved locally</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Links for later</h2>
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={savedVideos.length === 0}
            className="w-fit rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Clear list
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {savedVideos.length === 0 ? (
            <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">No saved links yet.</p>
          ) : (
            savedVideos.map((video) => (
              <div key={video.id} className="rounded-md border border-gray-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-950">{video.title}</h3>
                    <p className="mt-1 break-all text-sm text-gray-600">{video.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyText('Saved URL copied', video.url)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 transition hover:border-gray-900"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVideo(video.id)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-900 transition hover:border-gray-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 rounded-md border border-gray-200 bg-gray-50 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-950">Download note</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          This tool does not download YouTube videos. For videos you own, use YouTube Studio,
          Google Takeout, or YouTube Premium offline features where available.
        </p>
      </div>
    </section>
  )
}
