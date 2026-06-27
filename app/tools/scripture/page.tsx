'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

type Verse = {
  book: string
  chapter: number
  verse: number
  text: string
}

type ParsedReference = {
  book: string
  chapter: number
  startVerse: number
  endVerse: number
}

const bookAliases: Record<string, string> = {
  '\u7d04': '\u7d04\u7ff0\u798f\u97f3',
  '\u7d04\u7ff0': '\u7d04\u7ff0\u798f\u97f3',
  '\u7d04\u7ff0\u798f\u97f3': '\u7d04\u7ff0\u798f\u97f3',
  '\u7f85': '\u7f85\u99ac\u66f8',
  '\u7f85\u99ac': '\u7f85\u99ac\u66f8',
  '\u7f85\u99ac\u66f8': '\u7f85\u99ac\u66f8',
  '\u8a69': '\u8a69\u7bc7',
  '\u8a69\u7bc7': '\u8a69\u7bc7',
  '\u8cfd': '\u4ee5\u8cfd\u4e9e\u66f8',
  '\u4ee5\u8cfd\u4e9e': '\u4ee5\u8cfd\u4e9e\u66f8',
  '\u4ee5\u8cfd\u4e9e\u66f8': '\u4ee5\u8cfd\u4e9e\u66f8',
  '\u592a': '\u99ac\u592a\u798f\u97f3',
  '\u99ac\u592a': '\u99ac\u592a\u798f\u97f3',
  '\u99ac\u592a\u798f\u97f3': '\u99ac\u592a\u798f\u97f3',
  '\u53ef': '\u99ac\u53ef\u798f\u97f3',
  '\u99ac\u53ef': '\u99ac\u53ef\u798f\u97f3',
  '\u99ac\u53ef\u798f\u97f3': '\u99ac\u53ef\u798f\u97f3',
  '\u8def': '\u8def\u52a0\u798f\u97f3',
  '\u8def\u52a0': '\u8def\u52a0\u798f\u97f3',
  '\u8def\u52a0\u798f\u97f3': '\u8def\u52a0\u798f\u97f3',
  '\u5f92': '\u4f7f\u5f92\u884c\u50b3',
  '\u4f7f\u5f92': '\u4f7f\u5f92\u884c\u50b3',
  '\u4f7f\u5f92\u884c\u50b3': '\u4f7f\u5f92\u884c\u50b3',
  '\u6797\u524d': '\u54e5\u6797\u591a\u524d\u66f8',
  '\u54e5\u524d': '\u54e5\u6797\u591a\u524d\u66f8',
  '\u54e5\u6797\u591a\u524d\u66f8': '\u54e5\u6797\u591a\u524d\u66f8',
  '\u6797\u5f8c': '\u54e5\u6797\u591a\u5f8c\u66f8',
  '\u54e5\u5f8c': '\u54e5\u6797\u591a\u5f8c\u66f8',
  '\u54e5\u6797\u591a\u5f8c\u66f8': '\u54e5\u6797\u591a\u5f8c\u66f8',
  John: '\u7d04\u7ff0\u798f\u97f3',
  Romans: '\u7f85\u99ac\u66f8',
  Psalms: '\u8a69\u7bc7',
  Psalm: '\u8a69\u7bc7',
  Isaiah: '\u4ee5\u8cfd\u4e9e\u66f8',
  Matthew: '\u99ac\u592a\u798f\u97f3',
  Mark: '\u99ac\u53ef\u798f\u97f3',
  Luke: '\u8def\u52a0\u798f\u97f3',
  Acts: '\u4f7f\u5f92\u884c\u50b3',
}

const scriptureStorageKey = 'baicai-scripture-helper-verses'
const weeklyListStorageKey = 'baicai-scripture-helper-weekly-list'

const referenceExamples = [
  '\u7d043:16',
  '\u7d04 3:16-18',
  '\u7d04\u7ff0\u798f\u97f3 3:16',
  '\u7d04\u7ff0\u798f\u97f33\u7ae016\u7bc0',
]

function normalizeBook(book: string) {
  return bookAliases[book.trim()] ?? book.trim()
}

function formatReference(verse: Verse) {
  return `${verse.book} ${verse.chapter}:${verse.verse}`
}

function formatWithReference(verses: Verse[]) {
  return verses.map((verse) => `${formatReference(verse)} ${verse.text}`).join('\n')
}

function formatVerseTextOnly(verses: Verse[]) {
  return verses.map((verse) => verse.text).join('\n')
}

function formatPpt(verses: Verse[]) {
  return verses.map((verse) => `${verse.text}\n${formatReference(verse)}`).join('\n\n')
}

function parseReference(input: string): ParsedReference | null {
  const compact = input.trim().replace(/\s+/g, '').replace(/\u7ae0/g, ':').replace(/\u7bc0/g, '')
  const aliases = Object.keys(bookAliases).sort((a, b) => b.length - a.length)
  const alias = aliases.find((candidate) => compact.startsWith(candidate))

  if (!alias) {
    return null
  }

  const match = compact.slice(alias.length).match(/^(\d+):(\d+)(?:-(\d+))?$/)

  if (!match) {
    return null
  }

  const chapter = Number(match[1])
  const startVerse = Number(match[2])
  const endVerse = match[3] ? Number(match[3]) : startVerse

  if (!chapter || !startVerse || endVerse < startVerse) {
    return null
  }

  return {
    book: bookAliases[alias],
    chapter,
    startVerse,
    endVerse,
  }
}

function isVerse(value: unknown): value is Verse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<Verse>
  return (
    typeof candidate.book === 'string' &&
    typeof candidate.chapter === 'number' &&
    typeof candidate.verse === 'number' &&
    typeof candidate.text === 'string'
  )
}

function parseImportedData(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { verses?: unknown }).verses)
      ? (value as { verses: unknown[] }).verses
      : []

  return source
    .filter(isVerse)
    .filter((verse) => Number.isInteger(verse.chapter) && Number.isInteger(verse.verse))
    .map((verse) => ({
      ...verse,
      book: normalizeBook(verse.book),
    }))
}

function parseStoredWeeklyList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((entry): entry is unknown[] => Array.isArray(entry))
    .map((entry) => parseImportedData(entry))
    .filter((entry) => entry.length > 0)
}

export default function ScriptureHelperPage() {
  const [verses, setVerses] = useState<Verse[]>([])
  const [query, setQuery] = useState('')
  const [weeklyList, setWeeklyList] = useState<Verse[][]>([])
  const [importStatus, setImportStatus] = useState('No scripture data imported yet.')
  const [copyStatus, setCopyStatus] = useState('')
  const [storageReady, setStorageReady] = useState(false)
  const [storageStatus, setStorageStatus] = useState('Checking browser storage...')

  useEffect(() => {
    try {
      const savedVerses = window.localStorage.getItem(scriptureStorageKey)
      const savedWeeklyList = window.localStorage.getItem(weeklyListStorageKey)

      if (savedVerses) {
        const restoredVerses = parseImportedData(JSON.parse(savedVerses))
        setVerses(restoredVerses)
        setImportStatus(`Restored ${restoredVerses.length} verses from this browser.`)
      }

      if (savedWeeklyList) {
        setWeeklyList(parseStoredWeeklyList(JSON.parse(savedWeeklyList)))
      }

      setStorageStatus('Browser storage is available.')
    } catch {
      setStorageStatus('Browser storage is not available.')
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) {
      return
    }

    try {
      if (verses.length > 0) {
        window.localStorage.setItem(scriptureStorageKey, JSON.stringify(verses))
      } else {
        window.localStorage.removeItem(scriptureStorageKey)
      }
    } catch {
      setStorageStatus('Could not save imported data in this browser.')
    }
  }, [storageReady, verses])

  useEffect(() => {
    if (!storageReady) {
      return
    }

    try {
      if (weeklyList.length > 0) {
        window.localStorage.setItem(weeklyListStorageKey, JSON.stringify(weeklyList))
      } else {
        window.localStorage.removeItem(weeklyListStorageKey)
      }
    } catch {
      setStorageStatus('Could not save weekly passages in this browser.')
    }
  }, [storageReady, weeklyList])

  const matches = useMemo(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery || verses.length === 0) {
      return []
    }

    const reference = parseReference(trimmedQuery)

    if (reference) {
      return verses.filter(
        (verse) =>
          normalizeBook(verse.book) === reference.book &&
          verse.chapter === reference.chapter &&
          verse.verse >= reference.startVerse &&
          verse.verse <= reference.endVerse,
      )
    }

    const loweredQuery = trimmedQuery.toLowerCase()
    return verses.filter((verse) =>
      `${formatReference(verse)} ${verse.text}`.toLowerCase().includes(loweredQuery),
    )
  }, [query, verses])

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const imported = parseImportedData(JSON.parse(text))
      setVerses(imported)
      setImportStatus(`Imported ${imported.length} verses from ${file.name}.`)
      setStorageStatus(imported.length > 0 ? 'Imported data is saved in this browser.' : 'No data saved yet.')
    } catch {
      setImportStatus('Import failed. Please use valid JSON scripture data.')
    } finally {
      event.target.value = ''
    }
  }

  async function copyText(text: string, label: string) {
    if (!text) {
      setCopyStatus('Nothing to copy yet.')
      return
    }

    await navigator.clipboard.writeText(text)
    setCopyStatus(`${label} copied.`)
  }

  function addCurrentResult() {
    if (matches.length === 0) {
      setCopyStatus('Search a passage before adding it to the weekly list.')
      return
    }

    setWeeklyList((current) => [...current, matches])
    setCopyStatus('Current result added to weekly list.')
  }

  function clearImportedData() {
    setVerses([])
    setQuery('')
    setImportStatus('Imported scripture data cleared from this browser.')
    setStorageStatus('No imported data saved in this browser.')

    try {
      window.localStorage.removeItem(scriptureStorageKey)
    } catch {
      setStorageStatus('Could not update browser storage.')
    }
  }

  const weeklyText = weeklyList.map((entry) => formatWithReference(entry)).join('\n\n')
  const importedDataSaved = verses.length > 0 && storageStatus !== 'Browser storage is not available.'

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Tools / Scripture Helper</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-950">Scripture Helper.</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">
          Import your own local scripture JSON, search by reference, copy formatted passages, and
          collect a weekly passage list.
        </p>
      </div>

      <div className="mt-10 rounded-md border border-gray-200 bg-gray-50 p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-md border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Local import</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Scripture data</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Imported scripture data stays in this browser and is not uploaded.
            </p>
            <div className="mt-5 grid gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Imported verses</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-950">{verses.length}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Browser save</p>
                <p className="mt-2 text-sm font-medium text-gray-700">
                  {importedDataSaved ? 'Saved in this browser' : 'No imported data saved'}
                </p>
              </div>
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-gray-950">JSON file</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={importJson}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-gray-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white focus:border-gray-950"
              />
            </label>
            <p className="mt-4 text-sm text-gray-600">{importStatus}</p>
            <p className="mt-2 text-sm text-gray-600">{storageStatus}</p>
            <button
              type="button"
              onClick={clearImportedData}
              className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
            >
              Clear imported data
            </button>
            <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Simple JSON format</p>
              <pre className="mt-3 overflow-x-auto text-xs leading-5 text-gray-700">
{`[
  {
    "book": "${referenceExamples[0].slice(0, 1)}",
    "chapter": 3,
    "verse": 16,
    "text": "..."
  }
]`}
              </pre>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Search</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">Find passages</h2>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-gray-950">Reference or keyword</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={referenceExamples[0]}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-950 outline-none transition focus:border-gray-950"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
              {referenceExamples.map((example) => (
                <span key={example}>{example}</span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => copyText(formatWithReference(matches), 'Reference format')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
              >
                Copy with reference
              </button>
              <button
                type="button"
                onClick={() => copyText(formatVerseTextOnly(matches), 'Verse text')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
              >
                Copy verse text only
              </button>
              <button
                type="button"
                onClick={() => copyText(formatPpt(matches), 'PPT format')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
              >
                Copy PPT format
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-gray-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Results</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-950">Matched verses</h2>
            </div>
            <button
              type="button"
              onClick={addCurrentResult}
              className="w-fit rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
            >
              Add current result to list
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {matches.length > 0 ? (
              matches.map((verse) => (
                <article
                  key={`${verse.book}-${verse.chapter}-${verse.verse}`}
                  className="rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <p className="text-sm font-semibold text-gray-950">{formatReference(verse)}</p>
                  <p className="mt-2 text-base leading-7 text-gray-700">{verse.text}</p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  Import JSON data and search a reference to show matching verses.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border border-gray-200 p-5 sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Weekly passage list</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-950">Passages</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyText(weeklyText, 'All passages')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
            >
              Copy all passages
            </button>
            <button
              type="button"
              onClick={() => setWeeklyList([])}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition hover:border-gray-900"
            >
              Clear list
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {weeklyList.length > 0 ? (
              weeklyList.map((entry, index) => (
                <div
                  key={`${entry[0]?.book}-${entry[0]?.chapter}-${entry[0]?.verse}-${index}`}
                  className="rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Passage {index + 1}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                    {formatWithReference(entry)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm leading-6 text-gray-600">No passages added yet.</p>
              </div>
            )}
          </div>

          {copyStatus ? <p className="mt-4 text-sm text-gray-600">{copyStatus}</p> : null}
        </div>
      </div>
    </section>
  )
}
