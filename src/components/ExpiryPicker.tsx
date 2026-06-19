'use client'

import { useRef, useEffect, useCallback } from 'react'

export type ExpiryValue =
  | { type: 'preset'; minutes: 15 | 60 | 1440 | 10080 | 44640 }
  | { type: 'custom'; isoDate: string }
  | { type: 'never' }

const PRESETS: { label: string; minutes: 15 | 60 | 1440 | 10080 | 44640 }[] = [
  { label: '15 MIN', minutes: 15 },
  { label: '1 HR',   minutes: 60 },
  { label: '1 DAY',  minutes: 1440 },
  { label: '7 DAYS', minutes: 10080 },
  { label: '31 DAYS', minutes: 44640 },
]

interface Props {
  value: ExpiryValue
  onChange: (v: ExpiryValue) => void
}

export function ExpiryPicker({ value, onChange }: Props) {
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const isNever = value.type === 'never'
  const isCustom = value.type === 'custom'
  const activeMinutes = value.type === 'preset' ? value.minutes : null

  const syncPill = useCallback(() => {
    const pill = pillRef.current
    const bar  = tabsRef.current
    if (!pill || !bar) return
    const activeTab = bar.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    if (!activeTab) { pill.style.width = '0'; return }
    pill.style.width     = `${activeTab.offsetWidth}px`
    pill.style.transform = `translateX(${activeTab.offsetLeft}px)`
  }, [])

  useEffect(() => {
    const pill = pillRef.current
    if (pill) {
      pill.style.transition = 'none'
      syncPill()
      void pill.offsetWidth
      pill.style.transition = ''
    }
  }, [value.type, activeMinutes, syncPill])

  useEffect(() => {
    window.addEventListener('resize', syncPill)
    return () => window.removeEventListener('resize', syncPill)
  }, [syncPill])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="form-label">EXPIRES</span>

        <button
          type="button"
          aria-label={isNever ? 'Set expiry' : 'Make permanent'}
          aria-pressed={isNever}
          onClick={() =>
            onChange(isNever ? { type: 'preset', minutes: 15 } : { type: 'never' })
          }
          className="flex items-center gap-2 border-[3px] border-black px-3 py-1 text-[12px] font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:-translate-y-[1px] hover:translate-x-[1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all select-none"
          style={{ background: isNever ? 'black' : 'white', color: isNever ? 'white' : 'black' }}
        >
          <span className="t-icon-swap" data-state={isNever ? 'b' : 'a'}>
            <span className="t-icon" data-icon="a">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
            <span className="t-icon" data-icon="b">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4zm0 0c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
              </svg>
            </span>
          </span>
          {isNever ? 'NO EXPIRY' : 'SET EXPIRY'}
        </button>
      </div>

      <div
        className="t-panel-slide"
        data-open={(!isNever).toString()}
      >
        <div className="t-tabs" ref={tabsRef} role="tablist" aria-label="Link expiry">
          <span className="t-tabs-pill" ref={pillRef} aria-hidden="true" />
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              role="tab"
              type="button"
              aria-selected={String(activeMinutes === p.minutes && !isCustom) as 'true' | 'false'}
              onClick={() => onChange({ type: 'preset', minutes: p.minutes })}
              className="t-tab"
            >
              {p.label}
            </button>
          ))}
          <button
            role="tab"
            type="button"
            aria-selected={String(isCustom) as 'true' | 'false'}
            onClick={() => onChange({ type: 'custom', isoDate: '' })}
            className="t-tab"
          >
            CUSTOM
          </button>
        </div>

        <div
          className="t-panel-slide mt-3"
          data-open={String(isCustom)}
          style={{ '--panel-translate-y': '8px' } as React.CSSProperties}
        >
          <input
            type="datetime-local"
            className="input-field"
            value={value.type === 'custom' ? value.isoDate : ''}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            onChange={(e) => onChange({ type: 'custom', isoDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}

/** Convert an ExpiryValue to a UNIX ms timestamp or undefined (never) */
export function expiryValueToTimestamp(v: ExpiryValue): number | undefined {
  if (v.type === 'never') return undefined
  if (v.type === 'preset') return Date.now() + v.minutes * 60_000
  if (v.type === 'custom' && v.isoDate) return new Date(v.isoDate).getTime()
  return undefined
}
