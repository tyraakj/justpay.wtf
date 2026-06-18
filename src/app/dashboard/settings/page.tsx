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
      <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">Settings</h1>
          <p className="text-lg font-bold text-black uppercase mt-1">Manage your account preferences</p>
        </div>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col gap-8">
        {!address ? (
          <div className="text-center py-12 px-4 border-4 border-dashed border-black">
            <p className="text-xl font-bold text-black uppercase tracking-wider">Please connect your wallet to view settings.</p>
          </div>
        ) : (
          <>
            {/* Link Preferences */}
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-black uppercase tracking-wider border-b-4 border-black pb-2">Link Defaults</h2>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-cyan)] px-2 py-1 inline-block w-max border-2 border-black">Default Expiry</label>
                <select 
                  value={defaultExpiry}
                  onChange={(e) => setDefaultExpiry(e.target.value)}
                  className="w-full sm:max-w-[250px] bg-white border-[3px] border-black px-4 py-3 text-[16px] font-bold text-black focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-shadow cursor-pointer"
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
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-black text-black uppercase tracking-wider border-b-4 border-black pb-2">Notifications</h2>
              <label className="flex items-center gap-4 cursor-pointer p-4 border-[3px] border-black bg-[var(--color-section-pink)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow w-max">
                <input 
                  type="checkbox" 
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-6 h-6 border-2 border-black cursor-pointer accent-black"
                />
                <span className="text-[16px] font-black uppercase tracking-wider text-black">Email Notifications for Payments</span>
              </label>
            </div>

            <div className="pt-6 border-t-4 border-black mt-2">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-4 flex items-center justify-center gap-2 border-[3px] border-black bg-black text-white font-black uppercase text-[18px] shadow-[6px_6px_0px_0px_var(--color-section-yellow)] hover:-translate-y-[2px] hover:translate-x-[2px] hover:shadow-[8px_8px_0px_0px_var(--color-section-yellow)] transition-all w-full sm:w-auto"
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
