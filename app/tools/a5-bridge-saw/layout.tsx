import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'A5 Bridge Saw Converter',
  description: 'Custom inch to machine millimeter conversion for the A5 bridge saw.',
}

export default function A5BridgeSawLayout({ children }: { children: React.ReactNode }) {
  return children
}
