'use client';

import { useState } from 'react';
import { MessageCircle, Check, Copy, Smartphone } from 'lucide-react';
import { generateSMSDeepLink, generateWhatsAppDeepLink, detectPlatform } from '@/lib/deep-links';

interface SMSButtonProps {
  phone: string;
  message?: string;
  buttonText?: string;
  showWhatsApp?: boolean;
  className?: string;
}

export function SMSButton({ 
  phone, 
  message = 'HI', 
  buttonText, 
  showWhatsApp = false,
  className = ''
}: SMSButtonProps) {
  const [copied, setCopied] = useState(false);
  const platform = detectPlatform();
  
  const smsLink = generateSMSDeepLink(phone, message);
  const waLink = generateWhatsAppDeepLink(phone, message);
  
  const handleClick = () => {
    // Track click event (if analytics available)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('sms_deep_link_clicked', { 
        platform, 
        phone_suffix: phone.slice(-4) 
      });
    }
    
    // Fallback: copy to clipboard if deep link fails
    setTimeout(() => {
      if (document.hasFocus()) {
        navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }, 2000);
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  const defaultButtonText = platform === 'web' ? 'Text Us' : 'Open Messages';
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary SMS Button */}
      <a
        href={smsLink}
        onClick={handleClick}
        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
      >
        <MessageCircle size={20} />
        {buttonText || defaultButtonText}
      </a>
      
      {/* WhatsApp Button (optional) */}
      {showWhatsApp && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Smartphone size={20} />
          Open WhatsApp
        </a>
      )}
      
      {/* Copy Fallback */}
      <button
        onClick={handleCopy}
        className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {copied ? (
          <>
            <Check size={16} className="text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy size={16} />
            Copy number
          </>
        )}
      </button>
    </div>
  );
}

