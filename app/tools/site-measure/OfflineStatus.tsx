'use client'
import { useEffect, useState } from 'react'

type Readiness = 'preparing' | 'ready' | 'unavailable'

function checkWorker(worker: ServiceWorker): Promise<boolean> {
  return new Promise(resolve => {
    const channel = new MessageChannel()
    const timeout = setTimeout(() => { channel.port1.close(); resolve(false) }, 5000)
    channel.port1.onmessage = event => {
      clearTimeout(timeout)
      channel.port1.close()
      resolve(event.data?.ready === true)
    }
    worker.postMessage({ type: 'SITE_MEASURE_STATUS' }, [channel.port2])
  })
}

export default function OfflineStatus() {
  const [state, setState] = useState<Readiness>('preparing')
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let alive = true
    const networkChange = () => setOnline(navigator.onLine)
    networkChange()
    window.addEventListener('online', networkChange)
    window.addEventListener('offline', networkChange)
    if (!('serviceWorker' in navigator)) {
      queueMicrotask(() => { if (alive) setState('unavailable') })
      return () => {
        window.removeEventListener('online', networkChange)
        window.removeEventListener('offline', networkChange)
      }
    }

    async function prepare() {
      try {
        await navigator.serviceWorker.register('/site-measure-sw.js', {
          scope: '/tools/site-measure',
          updateViaCache: 'none',
        })
        // First-time installation takes control without reloading the page.
        if (!navigator.serviceWorker.controller) {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              navigator.serviceWorker.removeEventListener('controllerchange', changed)
              reject(new Error('Offline installation did not activate'))
            }, 20000)
            function changed() {
              clearTimeout(timeout)
              navigator.serviceWorker.removeEventListener('controllerchange', changed)
              resolve()
            }
            navigator.serviceWorker.addEventListener('controllerchange', changed)
            if (navigator.serviceWorker.controller) changed()
          })
        }
        // Warm optional PDF / DXF modules so field exports work without a signal.
        await Promise.all([
          import('./core/export-pdf'),
          import('./core/export-dxf'),
          fetch('/fonts/site-measure/NotoSansTC-Regular.ttf').then(response => {
            if (!response.ok) throw new Error('PDF font was not cached')
          }),
        ])
        const controller = navigator.serviceWorker.controller
        if (alive) setState(controller && await checkWorker(controller) ? 'ready' : 'unavailable')
      } catch {
        if (alive) setState('unavailable')
      }
    }
    void prepare()
    return () => {
      alive = false
      window.removeEventListener('online', networkChange)
      window.removeEventListener('offline', networkChange)
    }
  }, [])

  const label = !online
    ? state === 'ready' ? 'Offline · local projects' : 'Offline · do not reload'
    : state === 'ready' ? 'Offline ready'
    : state === 'preparing' ? 'Preparing offline access…' : 'Online only · offline unavailable'
  return <span className="sm-offline-state" data-testid="sm-offline-state" role="status"
    title={state === 'ready'
      ? 'This device can reopen Site Measure Studio without internet. Projects are stored in this browser.'
      : 'Keep your browser open while offline access is unavailable.'}>{label}</span>
}
