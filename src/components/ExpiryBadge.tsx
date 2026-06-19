'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  expiresAt: number | undefined
}

function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return 'EXPIRED'
  const s = Math.floor(msLeft / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

export function ExpiryBadge({ expiresAt }: Props) {
  const [label, setLabel] = useState<string>('')
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!expiresAt) return

    function tick() {
      const msLeft = expiresAt! - Date.now()
      const next = formatCountdown(msLeft)
      const el = spanRef.current
      if (!el || el.textContent === next) return

      el.classList.add('is-exit')
      setTimeout(() => {
        setLabel(next)
        el.classList.remove('is-exit')
        el.classList.add('is-enter-start')
        void el.offsetWidth
        el.classList.remove('is-enter-start')
      }, 150)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!expiresAt) return null

  return (
    <div className="flex items-center gap-2 border-[3px] border-black px-3 py-2 shadow-[3px_3px_0px_0px_#000] w-fit">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span className="text-[12px] font-black uppercase tracking-wider">
        LINK EXPIRES IN{' '}
        <span ref={spanRef} className="t-text-swap">{label}</span>
      </span>
    </div>
  )
}
