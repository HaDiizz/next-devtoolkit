'use client'

import { Star } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'

export function FavoriteToggle() {
  const pathname = usePathname()
  const { isFavorite, toggleFavorite } = useFavorites()

  const toolId = pathname.startsWith('/tools/') ? pathname.split('/').pop() : null

  if (!toolId) return null

  const active = isFavorite(toolId)

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-9 w-9 rounded-lg transition-all ${
        active
          ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 hover:text-yellow-600 dark:hover:bg-yellow-500/20'
          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground dark:hover:bg-secondary/80 dark:hover:text-foreground'
      }`}
      onClick={() => toggleFavorite(toolId)}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={`h-5 w-5 ${active ? 'fill-current' : ''}`} />
      <span className="sr-only">Favorite</span>
    </Button>
  )
}
