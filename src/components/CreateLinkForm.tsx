'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Wallet, ClipboardPaste, Copy, Check, X, QrCode, Share2, Download, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useAccount as useLiFiAccount } from '@lifi/wallet-management';
import { ChainType } from '@lifi/sdk';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WalletConnectButton } from './shared/WalletConnectButton';
import { ChainTokenSelector } from './shared/ChainTokenSelector';
import { ExpiryPicker, ExpiryValue, expiryValueToTimestamp } from './ExpiryPicker';
import { motion, AnimatePresence } from 'framer-motion';

const TOKEN_DOMAINS: Record<string, string> = {
  'ETH': 'ethereum.org',
  'USDC': 'circle.com',
  'USDT': 'tether.to',
  'SOL': 'solana.com',
  'SUI': 'sui.io'
};

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');
  const [expiry, setExpiry] = useState<ExpiryValue>({ type: 'preset', minutes: 15 });
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Success Modal State
  const [createdLinkUrl, setCreatedLinkUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Generates a branded QR card image on a temporary canvas.
   * Includes: brand header, QR code, payment details, and link URL.
   */
  const generateBrandedQR = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const qrCanvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
      if (!qrCanvas) { resolve(null); return; }

      const width = 600;
      const padding = 40;
      const headerHeight = 80;
      const qrSize = 280;
      const detailLineHeight = 28;

      // Collect details
      const details: string[] = [];
      if (amount && tokenSymbol) details.push(`Amount: ${amount} ${tokenSymbol}`);
      else if (amount) details.push(`Amount: ${amount}`);
      else if (tokenSymbol) details.push(`Token: ${tokenSymbol}`);
      if (chain) details.push(`Network: ${chain}`);
      if (memo) details.push(`Memo: ${memo}`);

      const detailsHeight = details.length > 0 ? (details.length * detailLineHeight) + 32 : 0;
      const urlHeight = 48;
      const height = headerHeight + padding + qrSize + padding + detailsHeight + urlHeight + padding;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(0, 0, width, height);

      // Header bar
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, headerHeight);

      // Brand text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Darker Grotesque", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('JUSTPAY.WTF', padding, 50);

      // "Payment Link" label
      ctx.fillStyle = '#00e5cc';
      ctx.font = 'bold 14px "Darker Grotesque", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('PAYMENT LINK', width - padding, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Darker Grotesque", sans-serif';
      ctx.fillText('Scan to pay', width - padding, 60);

      // QR code area — white box with border
      const qrX = (width - qrSize - 24) / 2;
      const qrY = headerHeight + padding;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX, qrY, qrSize + 24, qrSize + 24);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(qrX, qrY, qrSize + 24, qrSize + 24);

      // Draw actual QR
      ctx.drawImage(qrCanvas, qrX + 12, qrY + 12, qrSize, qrSize);

      // Details section
      let y = qrY + qrSize + 24 + 32;
      if (details.length > 0) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px "Darker Grotesque", sans-serif';
        ctx.textAlign = 'center';
        for (const detail of details) {
          ctx.fillText(detail.toUpperCase(), width / 2, y);
          y += detailLineHeight;
        }
      }

      // URL at the bottom
      y += 8;
      ctx.fillStyle = '#666666';
      ctx.font = '14px "Darker Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(createdLinkUrl || '', width / 2, y);

      // Bottom accent bar
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(0, height - 6, width, 6);

      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [createdLinkUrl, amount, tokenSymbol, chain, memo]);

  const router = useRouter();

  const { account: evmAccount } = useLiFiAccount({ chainType: ChainType.EVM });
  const { account: svmAccount } = useLiFiAccount({ chainType: ChainType.SVM });
  const { account: suiAccount } = useLiFiAccount({ chainType: ChainType.MVM });
  const connectedAddress = evmAccount?.address || svmAccount?.address || suiAccount?.address;
  const createLinkMutation = useMutation(api.links.createLink);

  useEffect(() => {
    if (evmAccount?.address && evmAccount?.chainId) {
      if (!address) setAddress(evmAccount.address);
      if (!chain) setChain(evmAccount.chainId.toString());
    } else if (svmAccount?.address) {
      if (!address) setAddress(svmAccount.address);
      if (!chain) setChain('sol');
    } else if (suiAccount?.address) {
      if (!address) setAddress(suiAccount.address);
      if (!chain) setChain('sui');
    }
  }, [evmAccount?.address, evmAccount?.chainId, svmAccount?.address, suiAccount?.address]);

  const handleCreate = async () => {
    const finalAddress = address || connectedAddress;
    if (!finalAddress) return;
    setIsLoading(true);

    try {
      const expiresAt = expiryValueToTimestamp(expiry)

      const result = await createLinkMutation({
        receiverAddress: finalAddress,
        destinationChain: chain ?? undefined,
        destinationTokenSymbol: tokenSymbol ?? undefined,
        destinationTokenAddress: undefined,
        amount: amount ? amount : undefined,
        receiverEmail: email || undefined,
        note: memo || undefined,
        expiresAt,
      });

      const existingStr = localStorage.getItem('justpay_links');
      let links = existingStr ? JSON.parse(existingStr) : [];
      links.unshift({ shortCode: result.shortCode, createdAt: new Date().toISOString() });
      if (links.length > 5) links = links.slice(0, 5);
      localStorage.setItem('justpay_links', JSON.stringify(links));

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://justpay.wtf';
      setCreatedLinkUrl(`${origin}/${result.shortCode}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to create link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Widget Box */}
      <div className="flex flex-col gap-4 relative z-10 transition-transform">

        {/* Destination Address Input (Top Priority) */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2">Receive to Address</label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : (chain === 'sui' ? "0x... (64 hex chars)" : chain === 'sol' ? "Solana address" : "Wallet address")}
              className="w-full bg-white border-[3px] border-black px-4 py-4 pr-32 text-[16px] font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-brand-softer)] transition-colors"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <span className="t-tt-wrap">
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setAddress(text.trim());
                    } catch (err) {
                      console.error('Failed to read clipboard', err);
                    }
                  }}
                  className="bg-[var(--color-section-yellow)] border-2 border-black p-2 hover:bg-[var(--color-section-pink)] transition-colors group hidden md:block t-tt-trigger"
                >
                  <ClipboardPaste className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                </button>
                <span className="t-tt bg-[var(--color-section-yellow)]" role="tooltip">Paste Address</span>
              </span>

              {connectedAddress && !address ? (
                <span className="t-tt-wrap">
                  <button
                    onClick={() => setAddress(connectedAddress)}
                    className="bg-[var(--color-section-cyan)] border-2 border-black p-2 hover:bg-[var(--color-section-green)] transition-colors group hidden md:block t-tt-trigger"
                  >
                    <Wallet className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="t-tt bg-[var(--color-section-cyan)]" role="tooltip">Autofill Wallet</span>
                </span>
              ) : (
                <span className="t-tt-wrap">
                  <WalletConnectButton variant="input" />
                  <span className="t-tt" role="tooltip">{connectedAddress ? "Disconnect Wallet" : "Connect Wallet"}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expiry Picker — always visible, default 15 min */}
        <ExpiryPicker value={expiry} onChange={setExpiry} />

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="text-[12px] font-bold uppercase tracking-wider text-zinc-600 hover:text-black bg-transparent border-t-2 border-dashed border-black/30 hover:border-black/100 pt-3 pb-2 mt-2 transition-all w-full text-center"
        >
          {isAdvancedOpen ? "- Hide Advanced Options" : "+ Show Advanced Options"}
        </button>

        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 border-[3px] border-black border-dashed p-3 mt-2"
            >
              {/* Token & Network Selection */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-cyan)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2">Network & Asset</label>
                <div className="bg-white border-[3px] border-black p-3 pt-4 hover:bg-slate-50 transition-colors">
                  <ChainTokenSelector
                    selectedChainId={chain}
                    selectedToken={tokenSymbol}
                    onChainSelect={setChain}
                    onTokenSelect={setTokenSymbol}
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2 relative group mt-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-pink)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2 transition-transform group-focus-within:-translate-y-1">Amount to Request</label>
                <div className="bg-white border-[3px] border-black flex items-center p-2 focus-within:bg-[var(--color-brand-softer)] transition-colors">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent px-2 py-3 text-[32px] md:text-[40px] font-black text-black placeholder:text-black/20 outline-none"
                  />
                  <div className="flex items-center gap-2 pr-4 bg-white px-3 py-2 border-2 border-black">
                    {tokenSymbol && TOKEN_DOMAINS[tokenSymbol] && (
                      <img src={`https://img.logo.dev/${TOKEN_DOMAINS[tokenSymbol]}?token=pk_BShsdiwDTuyRVVBW5GadOg&bg=transparent`} alt={tokenSymbol} className="w-6 h-6 object-contain bg-transparent" />
                    )}
                    <span className="text-xl font-black">{tokenSymbol ?? 'ANY'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-black">Memo (Optional)</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Invoice #123, Coffee, etc."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-section-yellow)] transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[12px] font-black uppercase tracking-wider text-black">Email (Receipts)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-section-cyan)] transition-colors"
                  />
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCreate}
          disabled={isLoading || (!address && !connectedAddress)}
          className="w-full mt-4 flex items-center justify-center gap-2 border-[4px] border-black bg-black px-6 py-4 text-[22px] font-black uppercase text-white shadow-[6px_6px_0px_0px_var(--color-section-yellow)] hover:shadow-[10px_10px_0px_0px_var(--color-section-yellow)] hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_var(--color-section-yellow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? 'Creating...' : 'Create Payment Link'}
          {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
        </button>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {createdLinkUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[var(--color-neutral-primary-soft)] border-[4px] border-black w-full max-w-md shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b-4 border-black bg-[var(--color-section-pink)]">
                <h2 className="text-xl font-black uppercase tracking-wider text-black">Link Created!</h2>
                <button
                  onClick={() => {
                    setCreatedLinkUrl(null);
                    setShowQR(false);
                  }}
                  className="hover:scale-110 transition-transform bg-white border-2 border-black p-1"
                >
                  <X className="w-5 h-5 text-black" strokeWidth={3} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-6 items-center">
                {!showQR ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="w-full flex items-center border-[3px] border-black bg-white p-2">
                      <a
                        href={createdLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-2 font-bold text-black truncate underline decoration-dotted hover:decoration-solid hover:text-blue-700 transition-colors"
                      >
                        {createdLinkUrl}
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdLinkUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="bg-[var(--color-section-yellow)] border-2 border-black p-2 hover:bg-[var(--color-section-cyan)] transition-colors group"
                      >
                        {copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />}
                      </button>
                    </div>

                    <div className="flex w-full gap-3 mt-2">
                      <button
                        onClick={async () => {
                          if (navigator.share) {
                            try { await navigator.share({ title: 'JustPay Link', url: createdLinkUrl }); }
                            catch (e) { }
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-white px-4 py-3 font-bold uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button
                        onClick={() => setShowQR(true)}
                        className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-black text-white px-4 py-3 font-bold uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-section-yellow)]"
                      >
                        <QrCode className="w-4 h-4" /> QR Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-6">
                    <div className="p-4 bg-white border-[3px] border-black">
                      <QRCodeCanvas
                        id="qr-canvas"
                        value={createdLinkUrl}
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"Q"}
                        includeMargin={false}
                      />
                    </div>

                    <div className="flex w-full gap-2">
                      <button
                        onClick={() => setShowQR(false)}
                        className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-white px-2 py-3 font-bold uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs md:text-sm"
                      >
                        <LinkIcon className="w-4 h-4" /> Link
                      </button>

                      <button
                        onClick={async () => {
                          const blob = await generateBrandedQR();
                          if (!blob) return;
                          const file = new File([blob], 'justpay-payment.png', { type: 'image/png' });
                          if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            try { await navigator.share({ files: [file], title: 'JustPay Payment QR' }); } catch (e) { }
                          } else {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.download = 'justpay-payment.png';
                            a.href = url;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-[var(--color-section-cyan)] px-2 py-3 font-bold uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs md:text-sm"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>

                      <button
                        onClick={async () => {
                          const blob = await generateBrandedQR();
                          if (!blob) return;
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.download = 'justpay-payment.png';
                          a.href = url;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 border-[3px] border-black bg-black text-white px-2 py-3 font-bold uppercase transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_var(--color-section-yellow)] text-xs md:text-sm"
                      >
                        <Download className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
