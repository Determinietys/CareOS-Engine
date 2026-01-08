'use client';

import { generateSMSDeepLink } from '@/lib/deep-links';
import dynamic from 'next/dynamic';

// Dynamically import QRCode to avoid SSR issues
const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-48 h-48 bg-gray-200 animate-pulse rounded" />,
});

interface SMSQRCodeProps {
  phone: string;
  message?: string;
  size?: number;
}

export function SMSQRCode({ phone, message = 'HI', size = 200 }: SMSQRCodeProps) {
  const smsLink = generateSMSDeepLink(phone, message);
  
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <QRCodeSVG 
        value={smsLink}
        size={size}
        level="M"
        includeMargin
      />
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Scan with your phone to open Messages
      </p>
    </div>
  );
}

