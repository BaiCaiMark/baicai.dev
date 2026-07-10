import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scripture Helper',
  description: 'Import local scripture data, find passages, and prepare a weekly passage list.',
}

export default function ScriptureLayout({ children }: { children: React.ReactNode }) {
  return children
}
