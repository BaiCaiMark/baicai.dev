'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import PageHeader from '../../components/PageHeader'

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
  const [storageStatus, setStorageStatus] = useState('Checking browser storage...')

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
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
      }
    }, 0)

    return () => window.clearTimeout(restoreTimer)
  }, [])

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

      try {
        if (imported.length > 0) {
          window.localStorage.setItem(scriptureStorageKey, JSON.stringify(imported))
          setStorageStatus('Imported data is saved in this browser.')
        } else {
          window.localStorage.removeItem(scriptureStorageKey)
          setStorageStatus('No data saved yet.')
        }
      } catch {
        setStorageStatus('Could not save imported data in this browser.')
      }
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

    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(`${label} copied.`)
    } catch {
      setCopyStatus('Copy failed. Please select and copy the text manually.')
    }
  }

  function addCurrentResult() {
    if (matches.length === 0) {
      setCopyStatus('Search a passage before adding it to the weekly list.')
      return
    }

    const nextWeeklyList = [...weeklyList, matches]
    setWeeklyList(nextWeeklyList)
    setCopyStatus('Current result added to weekly list.')

    try {
      window.localStorage.setItem(weeklyListStorageKey, JSON.stringify(nextWeeklyList))
    } catch {
      setStorageStatus('Could not save weekly passages in this browser.')
    }
  }

  function clearWeeklyList() {
    setWeeklyList([])
    setCopyStatus('Weekly passage list cleared.')

    try {
      window.localStorage.removeItem(weeklyListStorageKey)
    } catch {
      setStorageStatus('Could not update browser storage.')
    }
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
    <section className="page-section">
      <div className="site-container">
      <PageHeader
        eyebrow="Tools / Scripture Helper"
        title="Scripture Helper."
        description="Import your own local scripture JSON, search by reference, copy formatted passages, and collect a weekly passage list."
      />

      <div className="mt-10 border-y border-[var(--border)] bg-[var(--surface-muted)] py-6 sm:px-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
          <div className="bg-white p-5 sm:p-6">
            <p className="eyebrow">Local import</p>
            <h2 className="section-heading mt-2">Scripture data</h2>
            <p className="section-copy mt-3">
              Imported scripture data stays in this browser and is not uploaded.
            </p>
            <div className="mt-5 grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">Imported verses</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)]">{verses.length}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--muted)]">Browser save</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {importedDataSaved ? 'Saved in this browser' : 'No imported data saved'}
                </p>
              </div>
            </div>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[var(--foreground)]">JSON file</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={importJson}
                className="field-input mt-2 h-auto text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-strong)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <div className="mt-4 text-sm leading-6 text-[var(--muted)]" aria-live="polite">
              <p>{importStatus}</p>
              <p className="mt-1">{storageStatus}</p>
            </div>
            <button
              type="button"
              onClick={clearImportedData}
              disabled={verses.length === 0}
              className="button-secondary mt-4 w-full sm:w-auto"
            >
              Clear imported data
            </button>
            <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Simple JSON format</p>
              <pre className="mt-3 overflow-x-auto font-mono text-xs leading-5 text-[var(--foreground)]">
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

          <div className="bg-white p-5 sm:p-6">
            <p className="eyebrow">Search</p>
            <h2 className="section-heading mt-2">Find passages</h2>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-[var(--foreground)]">Reference or keyword</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={referenceExamples[0]}
                className="field-input mt-2 text-lg font-semibold"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
              {referenceExamples.map((example) => (
                <span key={example}>{example}</span>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => copyText(formatWithReference(matches), 'Reference format')}
                disabled={matches.length === 0}
                className="button-secondary"
              >
                Copy with reference
              </button>
              <button
                type="button"
                onClick={() => copyText(formatVerseTextOnly(matches), 'Verse text')}
                disabled={matches.length === 0}
                className="button-secondary"
              >
                Copy verse text only
              </button>
              <button
                type="button"
                onClick={() => copyText(formatPpt(matches), 'PPT format')}
                disabled={matches.length === 0}
                className="button-secondary sm:col-span-2"
              >
                Copy PPT format
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 border-t border-[var(--border)] pt-8 xl:grid-cols-[1.15fr_0.85fr] xl:gap-0">
        <div className="xl:border-r xl:border-[var(--border)] xl:pr-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Results</p>
              <h2 className="section-heading mt-2">Matched verses</h2>
            </div>
            <button
              type="button"
              onClick={addCurrentResult}
              disabled={matches.length === 0}
              className="button-secondary w-full sm:w-auto"
            >
              Add current result to list
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {matches.length > 0 ? (
              matches.map((verse) => (
                <article
                  key={`${verse.book}-${verse.chapter}-${verse.verse}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--brand-strong)]">{formatReference(verse)}</p>
                  <p className="mt-2 text-base leading-7 text-[var(--foreground)]">{verse.text}</p>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="section-copy">
                  Import JSON data and search a reference to show matching verses.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:pl-8">
          <p className="eyebrow">Weekly passage list</p>
          <h2 className="section-heading mt-2">Passages</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => copyText(weeklyText, 'All passages')}
              disabled={weeklyList.length === 0}
              className="button-secondary"
            >
              Copy all passages
            </button>
            <button
              type="button"
              onClick={clearWeeklyList}
              disabled={weeklyList.length === 0}
              className="button-secondary"
            >
              Clear list
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {weeklyList.length > 0 ? (
              weeklyList.map((entry, index) => (
                <div
                  key={`${entry[0]?.book}-${entry[0]?.chapter}-${entry[0]?.verse}-${index}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                >
                  <p className="text-xs font-semibold uppercase text-[var(--muted)]">Passage {index + 1}</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--foreground)]">
                    {formatWithReference(entry)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="section-copy">No passages added yet.</p>
              </div>
            )}
          </div>

          {copyStatus ? <p className="mt-4 text-sm text-[var(--muted)]" aria-live="polite">{copyStatus}</p> : null}
        </div>
      </div>
      </div>
    </section>
  )
}
