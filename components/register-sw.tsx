'use client'

import { useEffect } from 'react'

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/serwist/sw.js', {
          scope: '/',
        })
        .then((reg) => {
          console.log('SW registered', reg)
        })
        .catch(console.error)
    }
  }, [])

  return null
}
