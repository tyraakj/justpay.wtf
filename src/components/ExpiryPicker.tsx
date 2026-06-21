'use client'

export type ExpiryValue =
    | { type: 'preset'; minutes: 15 | 60 | 1440 | 10080 | 44640 }
    | { type: 'custom'; isoDate: string }
    | { type: 'never' }

const PRESETS: { label: string; minutes: 15 | 60 | 1440 | 10080 | 44640 }[] = [
    { label: '15 min', minutes: 15 },
    { label: '1 hour', minutes: 60 },
    { label: '1 day', minutes: 1440 },
    { label: '7 days', minutes: 10080 },
    { label: '30 days', minutes: 44640 },
]

interface Props {
    value: ExpiryValue
    onChange: (v: ExpiryValue) => void
}

export function ExpiryPicker({ value, onChange }: Props) {
    const isNever = value.type === 'never'
    const activeMinutes = value.type === 'preset' ? value.minutes : null
    const isCustom = value.type === 'custom'

    return (
        <div className="flex flex-col gap-3 border-[3px] border-black p-3 bg-white">
            {/* Toggle row */}
            <div className="flex items-center justify-between">
                <span className="text-[12px] font-black uppercase tracking-wider text-black">
                    Link Expiry
                </span>
                <div className="flex border-[3px] border-black">
                    <button
                        type="button"
                        onClick={() => onChange({ type: 'preset', minutes: 15 })}
                        className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${!isNever
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-black/5'
                            }`}
                    >
                        Expires
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange({ type: 'never' })}
                        className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border-l-[3px] border-black transition-colors ${isNever
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-black/5'
                            }`}
                    >
                        Never
                    </button>
                </div>
            </div>

            {/* Preset duration buttons — shown when expiry is on */}
            {!isNever && (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((p) => (
                            <button
                                key={p.minutes}
                                type="button"
                                onClick={() => onChange({ type: 'preset', minutes: p.minutes })}
                                className={`px-3 py-2 border-[3px] border-black text-[12px] font-black uppercase transition-all ${activeMinutes === p.minutes
                                    ? 'bg-[var(--color-section-cyan)] shadow-[3px_3px_0px_0px_#000] -translate-y-[1px]'
                                    : 'bg-white hover:bg-[var(--color-section-yellow)] shadow-[2px_2px_0px_0px_#000] hover:-translate-y-[1px]'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => onChange({ type: 'custom', isoDate: '' })}
                            className={`px-3 py-2 border-[3px] border-black text-[12px] font-black uppercase transition-all ${isCustom
                                ? 'bg-[var(--color-section-pink)] shadow-[3px_3px_0px_0px_#000] -translate-y-[1px]'
                                : 'bg-white hover:bg-[var(--color-section-yellow)] shadow-[2px_2px_0px_0px_#000] hover:-translate-y-[1px]'
                                }`}
                        >
                            Custom
                        </button>
                    </div>

                    {isCustom && (
                        <input
                            type="datetime-local"
                            className="border-[3px] border-black px-3 py-2 text-[14px] font-bold text-black outline-none focus:bg-[var(--color-section-cyan)] transition-colors"
                            value={value.type === 'custom' ? value.isoDate : ''}
                            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                            onChange={(e) => onChange({ type: 'custom', isoDate: e.target.value })}
                        />
                    )}
                </div>
            )}
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
