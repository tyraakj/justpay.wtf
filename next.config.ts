import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';
const supabaseUrls = isDev
  ? 'http://127.0.0.1:54321 http://127.0.0.1:54322'
  : 'https://*.supabase.co';

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' ${supabaseUrls} ws://localhost:3000 https://quote-api.jup.ag https://api.jup.ag https://api.0x.org https://dln.debridge.finance https://li.quest https://api.resend.com wss://*.walletconnect.com https://*.walletconnect.com https://*.infura.io https://*.alchemy.com https://rpc.helius.xyz https://fullnode.testnet.sui.io;
  frame-src 'self' https://verify.walletconnect.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspHeader.replace(/\n/g, '') },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
