'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'

export default function SettingsPage() {
  const { address: evmAddress } = useAccount()
  const { publicKey } = useWallet()
  const address = evmAddress || publicKey?.toBase58()

  const [notifications, setNotifications] = useState(true)
  const [defaultExpiry, setDefaultExpiry] = useState('15m')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!address) return;
    
    // Load local settings
    const savedExpiry = localStorage.getItem(`justpay_expiry_${address}`)
    if (savedExpiry) setDefaultExpiry(savedExpiry)
    
    const savedNotifs = localStorage.getItem(`justpay_notifs_${address}`)
    if (savedNotifs !== null) setNotifications(savedNotifs === 'true')
  }, [address])

  const handleSave = async () => {
    if (!address) return;
    setIsSaving(true)
    try {
      localStorage.setItem(`justpay_expiry_${address}`, defaultExpiry)
      localStorage.setItem(`justpay_notifs_${address}`, notifications.toString())

      alert('Settings saved successfully!')
    } catch (e) {
      console.error(e)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-zinc-400 mt-1">Manage your account preferences</p>
        </div>
      </div>

      <div className="glass-card p-6 flex flex-col gap-8">
        {!address ? (
          <div className="text-center py-12 text-zinc-400">
            Please connect your wallet to view settings.
          </div>
        ) : (
          <>
            {/* Link Preferences */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">Link Defaults</h2>
              <div className="flex flex-col gap-2">
                <label className="form-label">Default Expiry</label>
                <select 
                  value={defaultExpiry}
                  onChange={(e) => setDefaultExpiry(e.target.value)}
                  className="select-field max-w-[200px]"
                >
                  <option value="15m">15 Mins</option>
                  <option value="1h">1 Hour</option>
                  <option value="24h">24 Hours</option>
                  <option value="7d">7 Days</option>
                  <option value="none">Never</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-foreground border-b border-border pb-2">Notifications</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-black/50 checked:bg-primary"
                />
                <span className="text-sm font-medium text-zinc-300">Email Notifications for Payments</span>
              </label>
            </div>

            <div className="pt-4 border-t border-border">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
