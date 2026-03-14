import { openDB, IDBPDatabase } from 'idb'

export interface Favorite {
  id: string
  addedAt: number
  synced: boolean
}

let dbInstance: IDBPDatabase | null = null

export async function getDB() {
  if (dbInstance) return dbInstance
  dbInstance = await openDB('devtoolkit-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('favorites')) {
        const store = db.createObjectStore('favorites', { keyPath: 'id' })
        store.createIndex('by-synced', 'synced')
      }
    },
  })
  return dbInstance
}

export async function addFavorite(id: string): Promise<Favorite> {
  const db = await getDB()
  const favorite: Favorite = {
    id,
    addedAt: Date.now(),
    synced: false,
  }
  await db.put('favorites', favorite)
  return favorite
}

export async function removeFavorite(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('favorites', id)
}

export async function getFavorites(): Promise<Favorite[]> {
  const db = await getDB()
  return db.getAll('favorites')
}

export async function getUnsyncedFavorites(): Promise<Favorite[]> {
  const db = await getDB()
  const all = await db.getAll('favorites')
  return all.filter((f: Favorite) => !f.synced)
}

export async function markFavoriteSynced(id: string): Promise<void> {
  const db = await getDB()
  const favorite = await db.get('favorites', id)
  if (!favorite) return
  favorite.synced = true
  await db.put('favorites', favorite)
}
