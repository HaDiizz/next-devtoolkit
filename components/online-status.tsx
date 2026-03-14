'use client'

import { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { syncData } from '@/lib/sync'

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const online = navigator.onLine
    setIsOnline(online)
    if (!online) setShow(true)

    const handleOnline = () => {
      setIsOnline(true)
      void syncData()
      setTimeout(() => setShow(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShow(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 z-[9999] w-[90%] max-w-md -translate-x-1/2"
        >
          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              isOnline
                ? 'border-emerald-400/50 bg-emerald-500/90 text-white'
                : 'border-amber-400/50 bg-amber-500/90 text-white'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              {isOnline ? <Terminal size={20} /> : <WifiOff size={20} />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold">{isOnline ? 'Back Online' : 'Currently Offline'}</p>
              <p className="truncate text-xs opacity-90">
                {isOnline ? 'Your data is being synced.' : 'Changes will sync once you reconnect.'}
              </p>
            </div>
            <button
              onClick={() => setShow(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Terminal({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  )
}
