'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function SMSDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Welcome to CareOS! Text "HI" to get started.',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'consent' | 'name' | 'email' | 'password' | 'complete' | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [, setUserEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let botResponse = '';

    // Handle onboarding flow
    if (!onboardingStep || onboardingStep === 'consent') {
      const normalized = input.trim().toUpperCase();
      if (normalized === 'HI' || normalized === 'HELLO' || normalized === 'HEY') {
        setOnboardingStep('consent');
        botResponse = `👋 Welcome to CareOS!

By continuing, you agree to receive SMS messages for care coordination.

Msg & data rates may apply.
Reply STOP anytime to opt out.

Reply YES to continue.`;
      } else if (normalized === 'YES' || normalized === 'SÍ' || normalized === 'OUI') {
        setOnboardingStep('name');
        botResponse = "What's your first name?";
      } else {
        botResponse = '👋 Welcome to CareOS! Text "HI" to get started.';
      }
    } else if (onboardingStep === 'name') {
      const name = input.trim();
      if (name.length < 2) {
        botResponse = 'Please provide a valid name (at least 2 characters).';
      } else {
        setUserName(name);
        setOnboardingStep('email');
        botResponse = `Thanks ${name}! What's your email address? (for account recovery)`;
      }
    } else if (onboardingStep === 'email') {
      const email = input.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        botResponse = 'Please provide a valid email address.';
      } else {
        setUserEmail(email);
        setOnboardingStep('password');
        botResponse = 'Create a password (at least 6 characters):';
      }
    } else if (onboardingStep === 'password') {
      const password = input.trim();
      if (password.length < 6) {
        botResponse = 'Password must be at least 6 characters. Please try again:';
      } else {
        setOnboardingStep('complete');
        botResponse = `Welcome to CareOS! 🎉

You can now text me:
• Health updates
• Medication reminders
• Appointments
• Tasks
• Questions

Try: "Mom took her blood pressure: 120/80"`;
      }
    } else {
      // Active user - use AI classification
      try {
        const classification = await fetch('/api/careos/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input.trim(), userName, language: 'en' }),
        }).then((res) => res.json());

        botResponse = classification.response || 'I received your message. How can I help?';
      } catch (error) {
        botResponse = `Hi${userName ? ` ${userName}` : ''}! I received your message. Let me help you with that.`;
      }
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* iPhone-style container */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Status bar */}
          <div className="bg-gray-900 text-white text-xs py-1 px-4 flex justify-between items-center">
            <span>9:41</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              💬
            </div>
            <div>
              <h2 className="font-semibold">CareOS</h2>
              <p className="text-xs opacity-90">SMS Demo</p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Onboarding progress */}
          {onboardingStep && onboardingStep !== 'complete' && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="flex-1 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${
                        onboardingStep === 'consent'
                          ? 20
                          : onboardingStep === 'name'
                          ? 40
                          : onboardingStep === 'email'
                          ? 60
                          : onboardingStep === 'password'
                          ? 80
                          : 100
                      }%`,
                    }}
                  />
                </div>
                <span>
                  Step{' '}
                  {onboardingStep === 'consent'
                    ? '1'
                    : onboardingStep === 'name'
                    ? '2'
                    : onboardingStep === 'email'
                    ? '3'
                    : '4'}{' '}
                  of 5
                </span>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                ➤
              </button>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

