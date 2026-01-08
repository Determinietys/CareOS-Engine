"use client"

/**
 * CareOS Unified - Main Application Component
 * 
 * This is the unified CareOS application that combines:
 * - Quick Capture (AI-powered input classification)
 * - HelperEngine (AI + Expert marketplace)
 * - Integration Hub (Connect external services)
 * - Data Intelligence (Analytics and insights)
 * 
 * Note: This is a client component that integrates with the CareOS Engine backend
 */

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Heart, Zap, Home, Settings, Menu, X, Thermometer, ListTodo, 
  PhoneCall, DollarSign, HelpCircle, Link as LinkIcon, Database, Activity,
  Sparkles, Send, Loader2, UserCircle, Calendar, Users, FileText,
  Bell, Clock, Plus, Search, ChevronRight, Phone, Mail, MapPin,
  AlertCircle, CheckCircle2, Star, MessageSquare, Folder, Shield,
  TrendingUp, Pill, GraduationCap, Stethoscope, Brain, 
  CalendarPlus
} from 'lucide-react'
import Link from 'next/link'

// Category definitions
const CATEGORIES = {
  health: { 
    label: 'Health & Symptoms', 
    icon: Thermometer, 
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200'
  },
  task: { 
    label: 'Tasks', 
    icon: ListTodo, 
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200'
  },
  call: { 
    label: 'Calls to Make', 
    icon: PhoneCall, 
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  appointment: { 
    label: 'Appointments', 
    icon: CalendarPlus, 
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200'
  },
  financial: { 
    label: 'Financial', 
    icon: DollarSign, 
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200'
  },
  medication: { 
    label: 'Medications', 
    icon: Pill, 
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200'
  },
  note: { 
    label: 'Notes', 
    icon: FileText, 
    color: 'from-stone-500 to-stone-600',
    bgColor: 'bg-stone-50',
    textColor: 'text-stone-700',
    borderColor: 'border-stone-200'
  }
}

export default function CareOSUnified() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('capture')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedItems, setCapturedItems] = useState<any[]>([])
  const [recentlyAdded, setRecentlyAdded] = useState<number | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Load captured items from API on mount
  useEffect(() => {
    if (session?.user) {
      // TODO: Fetch captured items from API
      // fetch('/api/careos/captured-items').then(...)
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isProcessing) return

    setIsProcessing(true)
    const text = inputText
    setInputText('')

    try {
      // Call API to classify and capture
      const response = await fetch('/api/careos/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()
      
      if (data.success) {
        const newItem = {
          id: Date.now(),
          ...data.classification,
          timestamp: new Date(),
          originalText: text
        }
        
        setCapturedItems(prev => [newItem, ...prev])
        setRecentlyAdded(newItem.id)
        setTimeout(() => setRecentlyAdded(null), 3000)
      }
    } catch (error) {
      console.error('Error capturing item:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const groupedItems = capturedItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const NavItem = ({ icon: Icon, label, tab, badge }: any) => (
    <button
      onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 w-full text-left relative ${
        activeTab === tab 
          ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 shadow-sm' 
          : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      <Icon size={20} strokeWidth={activeTab === tab ? 2.5 : 1.5} />
      <span className="font-medium">{label}</span>
      {badge && badge > 0 && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'p-4' : 'w-64 p-6 border-r border-stone-200'} bg-gradient-to-b from-stone-50 to-white flex flex-col h-full`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
          <Heart size={20} className="text-white" fill="white" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>CareOS</h1>
          <p className="text-xs text-stone-500">Family Care Hub</p>
        </div>
      </div>
      
      <nav className="space-y-2 flex-1">
        <NavItem icon={Zap} label="Quick Capture" tab="capture" badge={capturedItems.length} />
        <NavItem icon={Home} label="Dashboard" tab="dashboard" />
        <NavItem icon={Thermometer} label="Health Log" tab="health" badge={groupedItems.health?.length} />
        <NavItem icon={PhoneCall} label="Calls" tab="calls" badge={groupedItems.call?.length} />
        <NavItem icon={DollarSign} label="Financial" tab="financial" badge={groupedItems.financial?.length} />
        <NavItem icon={ListTodo} label="All Tasks" tab="tasks" />
        <NavItem icon={HelpCircle} label="HelperEngine" tab="helper" />
        <NavItem icon={LinkIcon} label="Integrations" tab="integrations" />
        <NavItem icon={Database} label="Data Intelligence" tab="data" />
      </nav>

      <div className="mt-auto pt-4 border-t border-stone-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-stone-600 hover:bg-stone-100 transition-all w-full"
        >
          <Settings size={20} strokeWidth={1.5} />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </div>
  )

  const QuickCaptureView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>What's on your mind?</h2>
          <p className="text-white/80 mb-6">Just type naturally — I'll organize it for you.</p>
          
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g., my head hurts, call John, check NVDA stock..."
              className="w-full px-6 py-4 pr-24 rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border border-white/30 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 text-lg"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="animate-spin text-amber-500" size={24} />
          <span className="text-stone-600 font-medium">Analyzing and organizing...</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const count = groupedItems[key]?.length || 0
          const Icon = cat.icon
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key === 'call' ? 'calls' : key)}
              className={`p-4 rounded-2xl ${cat.bgColor} border ${cat.borderColor} hover:shadow-md transition-all text-left`}
            >
              <Icon size={20} className={cat.textColor} />
              <p className="font-bold text-lg text-stone-800 mt-2">{count}</p>
              <p className="text-xs text-stone-500 truncate">{cat.label}</p>
            </button>
          )
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>Recent Captures</h3>
          <span className="text-sm text-stone-500">{capturedItems.length} items</span>
        </div>
        <div className="space-y-3">
          {capturedItems.slice(0, 10).map((item: any) => {
            const cat = CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.task
            const Icon = cat.icon
            const isNew = item.id === recentlyAdded
            
            return (
              <div
                key={item.id}
                className={`relative bg-white rounded-2xl p-4 border transition-all duration-500 group hover:shadow-md ${
                  isNew ? 'ring-2 ring-amber-400 shadow-lg scale-[1.02]' : 'border-stone-100'
                }`}
              >
                {isNew && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                    NEW
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-stone-800 leading-tight">{item.title}</h4>
                        {item.details && (
                          <p className="text-sm text-stone-500 mt-1">{item.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 whitespace-nowrap">{getTimeAgo(item.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${cat.bgColor} ${cat.textColor}`}>
                        {cat.label}
                      </span>
                      {item.person && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 flex items-center gap-1">
                          <UserCircle size={12} />
                          {item.person}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {item.originalText && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <p className="text-xs text-stone-400 italic">"{item.originalText}"</p>
                  </div>
                )}
              </div>
            )
          })}
          {capturedItems.length === 0 && (
            <div className="bg-stone-50 rounded-2xl p-12 text-center">
              <Zap size={40} className="text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">Start typing to capture your first item!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Items Captured', value: capturedItems.length, icon: Zap, color: 'from-amber-500 to-orange-500' },
                { label: 'Health Logs', value: groupedItems.health?.length || 0, icon: Thermometer, color: 'from-rose-500 to-pink-500' },
                { label: 'Calls', value: groupedItems.call?.length || 0, icon: PhoneCall, color: 'from-blue-500 to-indigo-500' },
                { label: 'Financial', value: groupedItems.financial?.length || 0, icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-100 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon size={22} className="text-white" />
                  </div>
                  <p className="text-3xl font-bold text-stone-800">{stat.value}</p>
                  <p className="text-sm text-stone-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )
      case 'helper':
        return (
          <div className="bg-violet-50 rounded-3xl p-12 text-center border border-violet-200">
            <HelpCircle size={48} className="text-violet-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-800 mb-2">HelperEngine</h3>
            <p className="text-stone-600 mb-6">Ask complex questions and connect with verified experts</p>
            <Link
              href="/helper-engine"
              className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Open HelperEngine
            </Link>
          </div>
        )
      case 'integrations':
        return (
          <div className="bg-violet-50 rounded-3xl p-12 text-center border border-violet-200">
            <LinkIcon size={48} className="text-violet-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-800 mb-2">Integration Hub</h3>
            <p className="text-stone-600 mb-6">Connect your calendars, health apps, and services</p>
            <Link
              href="/integrations"
              className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Open Integration Hub
            </Link>
          </div>
        )
      case 'data':
        return (
          <div className="bg-slate-800 rounded-3xl p-12 text-center text-white">
            <Database size={48} className="text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Data Intelligence</h3>
            <p className="text-slate-400 mb-6">Analytics and insights from your captured data</p>
            <Link
              href="/data-intelligence"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Open Data Dashboard
            </Link>
          </div>
        )
      default:
        return <QuickCaptureView />
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600 mb-4">Please sign in to access CareOS</p>
          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-orange-50/20" style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-stone-200 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Heart size={18} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-stone-800" style={{ fontFamily: 'Georgia, serif' }}>CareOS</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl hover:bg-stone-100">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40 pt-16">
          <div className="bg-white h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed left-0 top-0 h-screen">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8 pb-8">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Floating Quick Capture Button (Mobile) */}
      <button 
        onClick={() => { setActiveTab('capture'); inputRef.current?.focus(); }}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-orange-300 flex items-center justify-center text-white z-30"
      >
        <Plus size={28} />
      </button>
    </div>
  )
}
