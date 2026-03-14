'use client'

import { useState, useEffect, useCallback } from 'react'
import { getFavorites, addFavorite, removeFavorite } from '@/lib/db'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  const loadFavorites = useCallback(async () => {
    const stored = await getFavorites()
    setFavorites(stored.map((f) => f.id))
  }, [])

  useEffect(() => {
    void loadFavorites()
  }, [loadFavorites])

  const toggleFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(id)
      if (isFav) {
        void removeFavorite(id)
        return prev.filter((fid) => fid !== id)
      } else {
        void addFavorite(id)
        return [...prev, id]
      }
    })

    window.dispatchEvent(new Event('favorites-updated'))
  }, [])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  useEffect(() => {
    const handleUpdate = () => {
      void loadFavorites()
    }

    window.addEventListener('favorites-updated', handleUpdate)
    return () => {
      window.removeEventListener('favorites-updated', handleUpdate)
    }
  }, [loadFavorites])

  return { favorites, toggleFavorite, isFavorite }
}
