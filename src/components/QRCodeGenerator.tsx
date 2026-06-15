'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
}

export function QRCodeGenerator({ url }: QRCodeGeneratorProps) {
  const downloadQR = () => {
    const svg = document.getElementById('payment-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'justpay-payment.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-xl">
        <QRCodeSVG 
          value={url} 
          size={200} 
          level="H" 
          id="payment-qr" 
          fgColor="#09090b"
          bgColor="#ffffff" 
        />
      </div>
      
      <button 
        onClick={downloadQR}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
      >
        <Download className="w-4 h-4" />
        Download SVG
      </button>
    </div>
  );
}
