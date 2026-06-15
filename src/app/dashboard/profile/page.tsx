import { Key, Save, Wallet } from 'lucide-react';

export default function DashboardProfile() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white">Profile Settings</h1>
        <p className="text-sm text-gray-400">Manage your connected wallets and API keys.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connected Wallet Settings */}
        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Default Settlement Wallet</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="form-label">Solana Address</label>
              <input 
                type="text" 
                defaultValue="HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH" 
                className="input-field font-mono"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="form-label">EVM Address (Ethereum/Arbitrum/Polygon)</label>
              <input 
                type="text" 
                defaultValue="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" 
                className="input-field font-mono"
              />
            </div>

            <button className="btn-primary mt-2">
              <Save className="w-4 h-4" /> Save Wallet Settings
            </button>
          </div>
        </div>

        {/* API Keys Settings */}
        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-secondary/20 rounded-lg text-secondary">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">API Keys</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-400">
              Use your API key to programmatically generate payment links from your backend. Keep this secret.
            </p>

            <div className="flex flex-col gap-2">
              <label className="form-label">Live Secret Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  defaultValue="sk_live_1234567890abcdef" 
                  className="input-field font-mono"
                  readOnly
                />
                <button className="btn-secondary w-auto px-6 whitespace-nowrap">
                  Reveal
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button className="btn-secondary text-error hover:text-error hover:bg-error/10 border-transparent">
                Revoke API Key
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
