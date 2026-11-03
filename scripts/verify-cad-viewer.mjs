// Local fixture smoke test. Usage:
// node scripts/verify-cad-viewer.mjs path/to/example.dxf [path/to/example.dwg]
// Fixtures are not stored in the repository.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseDxf } from '@cadview/core'

const [, , dxfPath, dwgPath] = process.argv
if (!dxfPath) {
  console.error('Usage: node scripts/verify-cad-viewer.mjs <file.dxf> [file.dwg]')
  process.exit(2)
}
const dxf = parseDxf(readFileSync(dxfPath, 'utf8'))
console.log('DXF entities:', dxf.entities.length, 'layers:', dxf.layers.size)
if (!dxf.entities.length) process.exit(1)

if (dwgPath) {
  const jsPath = resolve('public/cad-viewer-wasm/dwgdxf.js')
  const wasmPath = resolve('public/cad-viewer-wasm/dwgdxf_bg.wasm')
  const converter = await import(pathToFileURL(jsPath).href)
  await converter.default({ module_or_path: new WebAssembly.Module(readFileSync(wasmPath)) })
  const bytes = converter.convertDwgToDxf(new Uint8Array(readFileSync(dwgPath)))
  console.log('DWG -> DXF bytes:', bytes.length)
  const converted = parseDxf(new TextDecoder().decode(bytes))
  console.log('DWG converted entities:', converted.entities.length, 'layers:', converted.layers.size)
  if (!converted.entities.length) process.exit(1)
}
