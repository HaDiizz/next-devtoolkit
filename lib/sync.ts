import { getUnsyncedFavorites, markFavoriteSynced } from './db'

export async function syncData() {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return
  }

  const unsynced = await getUnsyncedFavorites()
  if (unsynced.length === 0) return

  for (const item of unsynced) {
    try {
      await markFavoriteSynced(item.id)
    } catch (error) {
      console.error(error)
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void syncData()
  })
}
