'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'devtoolkit-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    let next: string[] = []
    setFavorites((prev) => {
      next = prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
      return next
    })

    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event('favorites-updated'))
    }, 0)
  }, [])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setFavorites(JSON.parse(stored))
        } catch {}
      }
    }

    window.addEventListener('favorites-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('favorites-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return { favorites, toggleFavorite, isFavorite }
}
